import * as cheerio from 'cheerio';
import * as config from '../../../../config/index';
import IDiningHallBase from '../../../models/dining-halls/IDiningHallBase';
import IMealHours from '../../../models/dining-halls/IMealHours';
import request from '../../../common/retryingRequest';
const { Meal } = require('../enum');

// Begin, end should be a number representing the hour of the day in 24h format
// e.g. 7am would be 7.0, 4pm would be 16.0 and 4:30pm would be 16.5
// 12am on the day of would be 0.0, 12am on the next would be 24.0

const DAYS: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Weekdays and weekend according to msu's hours site
const WEEKDAYS: string[] = DAYS.slice(DAYS.indexOf('monday'), DAYS.indexOf('thursday') + 1);

const CRAZY_HOURS_REGEX: RegExp = /[ ]*(?:open\s+)?(.+?-.+?)(?:\s*on .+?)?[ ]*(?:\n|$|;|\((.+)\))/i;
const LIMITED_MENU_REGEX: RegExp = /limited menu\s*(.+-.+)?/i;
const CLOSE_TIME_REGEX: RegExp = /(.+) (?:close(?:s)? at|open until)\s*(.+)?/i;
const OPEN_TIME_REGEX: RegExp = /(.+) open (?:at)?\s*(.+)?/i;

function doTimeSplit(time: string): string[] {
    return time
        .toLowerCase()
        .replace(/\./g, '')
        // Replace midnight with 24 so it parses properly to a float
        .replace('midnight', '24 am')
        .trim()
        .split(' ');
}

function parseTimeItself(timeSplit: string | string[]): number {
    if (typeof timeSplit === 'string') {
        timeSplit = doTimeSplit(timeSplit);
    }

    const mainTimeSplit = timeSplit[0].split(':');

    let time = parseInt(mainTimeSplit[0]);

    // If there is minutes
    if (mainTimeSplit.length >= 2) {
        time += (parseInt(mainTimeSplit[1]) / 60);
    }

    // If there is a time indicator, the indicator is pm, and it's not 12 pm (noon), add 12 to it

    if (timeSplit.length > 1 && timeSplit[1] === 'pm' && mainTimeSplit[0] !== '12') {
        time += 12;
    }

    return time;
}

function parseOnlyTimeString(timeStr: string): { start: number, end: number } {
    const parts = timeStr.split('-');

    if (parts.length !== 2) {
        throw new Error(`Expected two parts, got ${parts.length}`);
    }

    const [startSplit, endSplit] = parts.map(doTimeSplit);

    // If start has no time identifier, add the end one
    if (startSplit.length === 1) {
        startSplit.push(endSplit[1]);
    }

    return {
        start: parseTimeItself(startSplit),
        end: parseTimeItself(endSplit)
    };
}

function parseSingleData(rawData: string, meal: number): IMealHours {
    rawData = rawData.trim().toLowerCase();

    if (rawData.startsWith('closed')) {
        return { closed: true, meal };
    }

    if (!CRAZY_HOURS_REGEX.test(rawData)) {
        throw new Error(`Invalid data provided in single data: ${rawData}`);
    }

    const hoursMatch = rawData.match(CRAZY_HOURS_REGEX);

    const [, time, extra] = hoursMatch;

    const { start, end } = parseOnlyTimeString(time);

    const hoursObject: IMealHours = { closed: false, begin: start, end, meal, closeTimes: {}, openTimes: {} };

    if (extra) {
        const extraPieces = extra.split(';').map(p => p.trim());

        // TODO: Fix limited menu begin, currently sets it to null

        let shouldAddExtra: boolean = true;
        for (const extraPiece of extraPieces) {
            if (LIMITED_MENU_REGEX.test(extraPiece)) {
                const limitedMenuMatch = extraPiece.match(LIMITED_MENU_REGEX);

                if (limitedMenuMatch.length === 1 || !limitedMenuMatch[1]) {
                    hoursObject.limitedMenuBegin = start;
                } else {
                    hoursObject.limitedMenuBegin = parseOnlyTimeString(limitedMenuMatch[1]).start;
                }
            } else if (CLOSE_TIME_REGEX.test(extraPiece)) {
                const [, venue, rawTime] = extraPiece.match(CLOSE_TIME_REGEX);

                const closeTime = parseTimeItself(rawTime);

                // Support legacy version using grill close time
                if (venue.toLowerCase().includes('grill')) {
                    hoursObject.grillClosesAt = closeTime;
                }

                hoursObject.closeTimes[venue] = closeTime;
            } else if (OPEN_TIME_REGEX.test(extraPiece)) {
                const [, venue, rawTime] = extraPiece.match(OPEN_TIME_REGEX);

                hoursObject.closeTimes[venue] = parseTimeItself(rawTime);
            } else {
                continue;
            }

            shouldAddExtra = false;
        }

        if (shouldAddExtra) {
            hoursObject.extra = extra;
        }
    }

    return hoursObject;
}

function parseConstantTime(data): IMealHours[] {
    const parsed = [];

    for (let i = 0; i < data.length; i++) {
        const rawData = data[i];

        if (typeof rawData === 'object') {
            parsed.push(rawData);
            continue;
        }

        parsed.push(parseSingleData(rawData, i));
    }

    return parsed;
}

function parseVaryingTime(data: string[]) {
    // Holds rebuilt hours for Sunday and Mon-Th if they are separate
    const rebuilt = [[], []];

    let hasSplit = false;

    for (let i = 0; i < data.length; i++) {
        const rawData = data[i];

        const split = rawData.split(';');

        // Some splits need to be corrected in the case of something like
        // 5-8p.m. (riverwalk gril closes at 8; sparty's closes at ...)
        // This is done by collecting all things inside parentheses and
        // putting them in the same unit.
        const correctedSplit = [];

        for (let j = 0; j < split.length; j++) {
            if (split[j].includes('(')) {
                const pieces = [];

                for (j; j < split.length; j++) {
                    pieces.push(split[j]);

                    if (split[j].includes(')')) {
                        break;
                    }
                }

                correctedSplit.push(pieces.join(';'));
                continue;
            }

            correctedSplit.push(split[j]);
        }

        // If the times are the same for the entire sunday-thursday timeline,
        // parse it once and then push it to both rebuilt items
        if (correctedSplit.length === 1) {
            const parsed = parseSingleData(rawData, i);

            for (let j = 0; j < rebuilt.length; j++) {
                rebuilt[j].push(parsed);
            }

            continue;
        }

        for (let j = 0; j < 2; j++) {
            rebuilt[j].push(correctedSplit[j].split(':').pop().trim());
        }

        hasSplit = true;
    }

    if (!hasSplit) {
        const parsed = parseConstantTime(data);
        return [parsed, parsed];
    }

    return rebuilt.map(parseConstantTime);
}

function parseTimeData(data) {
    const parsedHours = {};

    for (const day of DAYS) {
        parsedHours[day] = [];
    }

    // Site now lists hours from Sun-Th, Friday, Sat
    const weekdayData = data[0];
    const fridayData = data[1];
    const saturdayData = data[2];

    const saturdayParsed = parseConstantTime(saturdayData);
    const fridayParsed = parseConstantTime(fridayData);
    const [sundayParsed, weekdayParsed] = parseVaryingTime(weekdayData);

    for (const day of WEEKDAYS) {
        parsedHours[day] = weekdayParsed;
    }

    parsedHours['sunday'] = sundayParsed;
    parsedHours['friday'] = fridayParsed;
    parsedHours['saturday'] = saturdayParsed;

    for (const day of Object.keys(parsedHours)) {
        while (parsedHours[day].length < Object.keys(Meal).length) {
            parsedHours[day].push({ closed: true, meal: parsedHours[day].length });
        }
    }

    return parsedHours;
}

async function retrieveDiningHallHours(diningHalls: IDiningHallBase[]): Promise<{ [searchName: string]: IMealHours }> {
    let body;
    try {
        body = await request(config.pages.EAT_AT_STATE + config.pages.DINING_HALL_HOURS);
    } catch (e) {
        throw e;
    }

    const $ = cheerio.load(body);

    const hours = {};

    for (const diningHall of diningHalls) {
        const expectedName = diningHall.fullName;

        const expectedHeader = $(`#${expectedName.toLowerCase().replace(/[^\w]/g, '')}`);

        if (!expectedHeader) {
            continue;
        }

        // wtf?
        const parentThreeLevelsUp = expectedHeader[0].parent.parent.parent;

        // This class represents a column of time data which we can
        // parse the hours out of
        const timeColumns = $(parentThreeLevelsUp).find('.medium-4.columns');

        // Hold the raw time span data
        // 0 will be M-Th
        // 1 will be Fri
        // 2 will be Sat-Sun
        const timeSpansRaw: (string[])[] = [];

        timeColumns.each(function () {
            const $column = $(this);

            // Recently, they seem to have moved from putting the times inside
            // <p> tags, and they're just in raw text. Best bet I think is to
            // kill all the rest of the tags and then separate text on newline
            const elementTypesToKill: string[] = ['p', 'div', 'h3'];

            for (const selector of elementTypesToKill) {
                const elements: Cheerio = $column.find(selector);

                if (!elements) {
                    continue;
                }

                elements.remove();
            }

            // Hold the raw hours data
            // 0 will be Breakfast
            // 1 will be Lunch
            // 2 will be Dinner
            // 3 will be Late Night
            // 4 will be Late Night (Snacks)
            // If any index does not exist, it is closed for that meal time
            const timeDataRaw: string[] = $column.text().split('\n').filter(i => i.trim().length != 0);

            timeSpansRaw.push(timeDataRaw);
        });

        hours[diningHall.searchName] = parseTimeData(timeSpansRaw);
    }

    return hours;
}

export { parseTimeData, parseOnlyTimeString, retrieveDiningHallHours };
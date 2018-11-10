"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const config = require("../../../../config");
const retryingRequest_1 = require("../../common/retryingRequest");
const { Meal } = require('../enum');
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
// Weekdays and weekend according to msu's hours site
const WEEKDAYS = DAYS.slice(DAYS.indexOf('monday'), DAYS.indexOf('thursday') + 1);
const WEEKEND = [DAYS[DAYS.length - 1], DAYS[0]];
const CRAZY_HOURS_REGEX = /[ ]*(?:open\s+)?(.+?-.+?)(?:\s*on .+?)?[ ]*(?:\n|$|;|\((.+)\))/i;
const LIMITED_MENU_REGEX = /limited menu\s*(.+-.+)?/i;
const CLOSE_TIME_REGEX = /(.+) (?:close(?:s)? at|open until)\s*(.+)?/i;
const OPEN_TIME_REGEX = /(.+) open (?:at)?\s*(.+)?/i;
function doTimeSplit(time) {
    return time
        .toLowerCase()
        .replace(/\./g, '')
        // Replace midnight with 24 so it parses properly to a float
        .replace('midnight', '24 am')
        .trim()
        .split(' ');
}
function parseTimeItself(timeSplit) {
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
function parseOnlyTimeString(timeStr) {
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
exports.parseOnlyTimeString = parseOnlyTimeString;
function parseSingleData(rawData, meal) {
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
    const hoursObject = { closed: false, begin: start, end, meal, closeTimes: {}, openTimes: {} };
    if (extra) {
        const extraPieces = extra.split(';').map(p => p.trim());
        let shouldAddExtra = true;
        for (const extraPiece of extraPieces) {
            if (LIMITED_MENU_REGEX.test(extraPiece)) {
                const limitedMenuMatch = extraPiece.match(LIMITED_MENU_REGEX);
                if (limitedMenuMatch.length === 1 || !limitedMenuMatch[1]) {
                    hoursObject.limitedMenuBegin = start;
                }
                else {
                    hoursObject.limitedMenuBegin = parseOnlyTimeString(limitedMenuMatch[1]).start;
                }
            }
            else if (CLOSE_TIME_REGEX.test(extraPiece)) {
                const [, venue, rawTime] = extraPiece.match(CLOSE_TIME_REGEX);
                const closeTime = parseTimeItself(rawTime);
                // Support legacy version using grill close time
                if (venue.toLowerCase().includes('grill')) {
                    hoursObject.grillClosesAt = closeTime;
                }
                hoursObject.closeTimes[venue] = closeTime;
            }
            else if (OPEN_TIME_REGEX.test(extraPiece)) {
                const [, venue, rawTime] = extraPiece.match(OPEN_TIME_REGEX);
                hoursObject.closeTimes[venue] = parseTimeItself(rawTime);
            }
            else {
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
function parseConstantTime(data) {
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
function parseVaryingTime(data) {
    const rebuilt = [[], []];
    let hasSplit = false;
    for (let i = 0; i < data.length; i++) {
        const rawData = data[i];
        const split = rawData.split(';');
        if (split.length === 1) {
            const parsed = parseSingleData(rawData, i);
            for (let j = 0; j < rebuilt.length; j++) {
                rebuilt[j].push(parsed);
            }
            continue;
        }
        for (let j = 0; j < 2; j++) {
            rebuilt[j].push(split[j].trim());
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
    const weekdayData = data[0];
    const fridayData = data[1];
    const weekendData = data[2];
    const weekdayParsed = parseConstantTime(weekdayData);
    const fridayParsed = parseConstantTime(fridayData);
    const weekendParsed = parseVaryingTime(weekendData);
    for (const day of WEEKDAYS) {
        parsedHours[day] = weekdayParsed;
    }
    parsedHours['friday'] = fridayParsed;
    for (let i = 0; i < weekendParsed.length; i++) {
        parsedHours[WEEKEND[i]] = weekendParsed[i];
    }
    for (const day of Object.keys(parsedHours)) {
        while (parsedHours[day].length < Object.keys(Meal).length) {
            parsedHours[day].push({ closed: true, meal: parsedHours[day].length });
        }
    }
    return parsedHours;
}
exports.parseTimeData = parseTimeData;
async function retrieveDiningHallHours(diningHalls) {
    let body;
    try {
        body = await retryingRequest_1.default(config.pages.EAT_AT_STATE + config.pages.DINING_HALL_HOURS);
    }
    catch (e) {
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
        const timeSpansRaw = [];
        timeColumns.each(function () {
            const $column = $(this);
            const timeElements = $column.find('p');
            // Hold the raw hours data
            // 0 will be Breakfast
            // 1 will be Lunch
            // 2 will be Dinner
            // 3 will be Late Night
            // If any index does not exist, it is closed for that meal time
            const timeDataRaw = [];
            timeElements.each(function () {
                timeDataRaw.push($(this).text());
            });
            timeSpansRaw.push(timeDataRaw);
        });
        hours[diningHall.searchName] = parseTimeData(timeSpansRaw);
    }
    return hours;
}
exports.retrieveDiningHallHours = retrieveDiningHallHours;
//# sourceMappingURL=hours.js.map
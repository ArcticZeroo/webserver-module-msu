import IMovieLocation from '../../interfaces/movies/IMovieLocation';
import Identifiers from '../enum/RegexIdentifier';
import IConvertedMovie from '../../interfaces/movies/IConvertedMovie';
import StringUtil from './StringUtil';
import DateUtil from './DateUtil';

interface IConversionData {
    regex: RegExp,
    matches?: string[]
}

const Conversions: { [name: string]: IConversionData } = {
    MOVIES: {
        regex: /(.+)\s+-\s+(.+)[,.]\s+(.+?)\s(\d+\w{0,2}(?:(?:-)\d+\w{0,2})?)+\s+@\s+(.+)/,
        // (.+)\s*-\s*(\S+)\s+(\S+)\s+(\d+)(?:[\w]{2})?\s*@\s*(.+)
        // .+\s+-\s+(.+),\s+(.+?)\s((?:\d+(?:-)?)+)[\w]{0,2}\s+@\s+(.+)
        matches: [Identifiers.TEXT, Identifiers.LOCATION, Identifiers.WEEKDAY, Identifiers.MONTH, Identifiers.DAY, 'showtimes']
    },
    MOVIE_TIME: {
        regex: /([\d]{1,2}):([\d]{1,2})(.{1,2})/,
        matches: [Identifiers.TEXT, Identifiers.HOUR, Identifiers.MINUTE, Identifiers.SUFFIX]
    },
    EXTRA_DATA: {
        regex: /\(.+\)/
    }
};

const CLEAN_NUMBER_REGEX = /[^\d]/;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function cleanNumber(num: any): number {
    if (typeof num !== 'string') {
        num = num.toString();
    }

    try {
        return parseInt(num.replace(CLEAN_NUMBER_REGEX, ''));
    } catch (e) {
        return 0;
    }
}

interface IConvertedObject {
    getDate: () => { month: number, day: string };
    getTime: () => { hour: number, minute: number };
    toDate: () => Date;
}

function extendConverted<D = {}>(obj: any): IConvertedObject & D {
    obj.getDate = function () {
        const {[Identifiers.MONTH]: month, [Identifiers.DAY]: day} = obj;

        if (!month || !day) {
            return null;
        }

        // Calendar handling
        const monthIndex = MONTHS.indexOf(StringUtil.capitalize(month));

        return {month: monthIndex, day};
    };

    obj.getTime = function () {
        let {[Identifiers.HOUR]: hour, [Identifiers.MINUTE]: minute, [Identifiers.SUFFIX]: suffix} = obj;

        if (!hour || !minute || !suffix) {
            return null;
        }

        // Time handling
        hour = parseInt(hour);
        minute = parseInt(minute);

        if (suffix.toLowerCase() !== 'am') {
            hour += 12;
        }

        return {hour, minute};
    };

    obj.toDate = function () {
        return DateUtil.createDate(obj.getTime(), obj.getDate());
    };

    return obj;
}

export default class ConversionUtil {
    /**
     *
     * @param {string} str - The string to convert
     * @param {object} conversion - An object containing conversion data
     * @returns {object|null}
     */
    static convert<D = {}>(str: string, conversion: IConversionData): IConvertedObject & D {
        const match = conversion.regex.exec(str);

        if (!match) {
            return null;
        }

        const converted = {};

        for (let i = 0; i < match.length; i++) {
            converted[conversion.matches[i]] = match[i].trim().replace(/\s/g, ' ');
        }

        return extendConverted(converted);
    }

    static convertMovie(str: string): IMovieLocation {
        let extra;

        const extraMatch = Conversions.EXTRA_DATA.regex.exec(str);

        if (extraMatch) {
            extra = extraMatch[0];

            str.replace(extra, '');
        }

        const converted = ConversionUtil.convert<IConvertedMovie>(str, Conversions.MOVIES);

        if (!converted) {
            return null;
        }

        if (extra) {
            converted[Identifiers.LOCATION] += ` ${extra}`;
        }

        const movie: IMovieLocation = {location: converted[Identifiers.LOCATION], showtimes: []};

        const showtimes: string[] = converted.showtimes.split(/\s*[,&]\s+/g);

        const relevantDays: number[] = [];
        const parsedDate = converted.getDate();

        // Range between two dates, hopefully in the same month.
        // If the second smaller, that means different months and
        // we will just use the from for now. Hopefully that isn't an issue.
        if (parsedDate.day && parsedDate.day.includes('-')) {
            // Remove all the characters from the number, in the case of 21st, etc.
            const [from, to] = parsedDate.day.split('-').map(cleanNumber);

            if (to < from) {
                relevantDays.push(from);
            } else {
                for (let day = from; day <= to; day++) {
                    relevantDays.push(day);
                }
            }
        } else {
            relevantDays.push(cleanNumber(parsedDate.day));
        }

        for (const day of relevantDays) {
            const dateInformation = {...converted.getDate(), day};

            for (const showtime of showtimes) {
                const convertedShowtime = ConversionUtil.convert(showtime, Conversions.MOVIE_TIME);

                if (convertedShowtime) {
                    movie.showtimes.push(DateUtil.createDate(convertedShowtime.getTime(), dateInformation).getTime());
                }
            }
        }

        return movie;
    }
}

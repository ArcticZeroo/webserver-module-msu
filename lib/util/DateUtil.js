const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class DateUtil {
    static createFromTimeString(hoursWithColon, amOrPm) {
        const date = new Date();

        const timeSplit = hoursWithColon.split(':');

        let hour = parseInt(timeSplit[0]);
        const minute = parseInt(timeSplit[1]);

        if (amOrPm.toUpperCase().trim() === 'PM') {
            hour += 12;
        }

        date.setHours(hour, minute, 0, 0);

        return date;
    }

    /**
    * Create a date from a msu time string.
    * @param {string} timeString - The time of day to use, should look like "11:30 PM"
    * @param {string} dayString - The day and month to use, should look like "Thursday, October 12th"
    * @returns {Date}
    */
    static createFromFoodTruckString(timeString, dayString) {
        const split = timeString.split(' ');

        const date = DateUtil.createFromTimeString(split[0], split[1]);

        if (dayString) {
            const dayStringSplit = dayString.split(', ');

            const daySplit = dayStringSplit[1].split(' ');

            const month = daySplit[0];

            const dayOfMonth = parseInt(daySplit[1].replace(/[^\d]/g, ''));

            date.setMonth(MONTHS.indexOf(month), dayOfMonth);
        }

        return date;
    }

    static createFromMovieNightString(timeString, dayString) {
        const suffix = timeString.slice(timeString.length - 2).toUpperCase();

        timeString = timeString.substring(0, timeString.length - 2);

        const date = DateUtil.createFromTimeString(timeString, suffix);

        if (dayString) {
            dayString = dayString.split(' ').slice(1).join(' ');

            const month = dayString.substring(0, dayString.length - 4);

            const dayOfMonth = parseInt(dayString.substring(dayString.length - 4, dayString.length - 2).replace(/[^\d]/g, ''));

            date.setMonth(MONTHS.indexOf(month), dayOfMonth);
        }

        return date;
    }

    static createDate(...sources) {
        const source = { ...sources };

        const date = new Date();

        if (source.month) {
            date.setMonth(source.month);
        }

        if (source.day) {
            date.setDate(source.day);
        }

        date.setHours(source.hour || 0, source.minute || 0, 0, 0);

        return date;
    }
}

module.exports = DateUtil;
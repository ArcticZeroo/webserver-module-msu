class DateUtil {
    static createDate(...sources) {
        const source = Object.assign({}, ...sources);

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
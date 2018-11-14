import Identifiers from '../../enum/RegexIdentifier';

export default interface IConvertedMovie {
    [Identifiers.TEXT]: string;
    [Identifiers.LOCATION]: string;
    [Identifiers.WEEKDAY]: string;
    [Identifiers.MONTH]: string;
    [Identifiers.DAY]: string;
    showtimes: string;
}
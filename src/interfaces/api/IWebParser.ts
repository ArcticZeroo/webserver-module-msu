export default interface IWebParser<T> {
    parse($: CheerioStatic): T;
}
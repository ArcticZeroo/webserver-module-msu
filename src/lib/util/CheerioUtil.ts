export default abstract class CheerioUtil {
    private static readonly splitRegex = /,\s+/;

    static mapChildrenToString($: CheerioStatic, item: Cheerio): string[] {
        return item.map((i, element) => $(element).text().trim()).get().filter(e => !!e);
    }

    static convertChildrenListToStrings($: CheerioStatic, item: Cheerio): string[] {
        const childrenStrings: string[] = [];

        item.each((index, element) => {
            const text = $(element).text().trim();

            if (!text) {
                return;
            }

            const pieces = text.split(CheerioUtil.splitRegex);
            childrenStrings.push(...pieces);
        });

        return childrenStrings;
    }
}
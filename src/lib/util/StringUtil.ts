export default abstract class StringUtil {
    static capitalize(str: string): string {
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
}
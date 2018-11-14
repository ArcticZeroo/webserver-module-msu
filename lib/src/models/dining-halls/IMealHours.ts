export default interface IMealHours {
    closed: boolean;
    meal: number;
    // The following are always provided
    // if not closed
    begin?: number;
    end?: number;
    closeTimes?: { [name: string]: number };
    openTimes?: { [name: string]: number };
    // The following are only provided
    // when applicable
    limitedMenuBegin?: number;
    grillClosesAt?: number;
    extra?: string;
}
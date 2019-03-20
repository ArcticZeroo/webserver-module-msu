import dateFormat from 'dateformat';

export default class MenuDate {
    private _date: Date;

    constructor(initial?: Date) {
        this._date = initial || new Date();
    }

    get date() {
        return new Date(this._date);
    }

    getFormatted(): string {
        return dateFormat(this._date, 'yyyy-mm-dd');
    }

    forward(): void {
        this._date.setDate(this._date.getDate() + 1);
    }

    back(): void {
        this._date.setDate(this._date.getDate() - 1);
    }

    today(): void {
        this._date = new Date();
    }

    static fromFormatted(str: string): MenuDate {
        const split = str.split('-').map(s => parseInt(s.replace(/^0+(\d+)/, '$1')));
        split[1] -= 1;

        const date = new Date();
        // @ts-ignore - not sure how this worked before but I'll allow it
        date.setFullYear(...split);

        return new MenuDate(date);
    }
}
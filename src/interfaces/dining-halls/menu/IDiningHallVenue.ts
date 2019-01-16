import IMenuItem from './IMenuItem';

export default interface IDiningHallVenue {
    venueName: string;
    description?: string;
    menu: IMenuItem[];
}
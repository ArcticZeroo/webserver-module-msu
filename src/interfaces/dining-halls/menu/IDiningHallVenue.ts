import IMenuItem from './IMenuItem';

export default interface IDiningHallVenue {
    name: string;
    description?: string;
    menu: IMenuItem[];
}
import { Meal } from '../../../submodules/dininghalls/enum';

export default interface IMongoMenuSelection {
    // Search name
    diningHall: string;
    // Derived from menuDate.date
    date: Date;
    // index of the meal enum, same as normal meal selection
    meal: Meal
}
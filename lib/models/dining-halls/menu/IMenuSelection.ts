import { MenuDate } from '../../../src/dininghalls/api/food';
import IDiningHallBase from '../IDiningHallBase';

export default interface IMenuSelection {
    diningHall: IDiningHallBase,
    menuDate: MenuDate,
    meal: number // from MealIdentifier
}
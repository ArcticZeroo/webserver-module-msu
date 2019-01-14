import { MenuDate } from '../../../submodules/dininghalls/api/food';
import { Meal } from '../../../submodules/dininghalls/enum';
import IDiningHallBase from '../IDiningHallBase';

export default interface IMenuSelection {
    diningHall: IDiningHallBase,
    menuDate: MenuDate,
    meal: Meal // from MealIdentifier
}
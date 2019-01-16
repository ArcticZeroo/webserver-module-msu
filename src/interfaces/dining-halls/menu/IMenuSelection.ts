import { MenuDate } from '../../../lib/submodules/dininghalls/api/food';
import { Meal } from '../../../lib/submodules/dininghalls/enum';
import IDiningHallBase from '../IDiningHallBase';

export default interface IMenuSelection {
    diningHall: IDiningHallBase,
    menuDate: MenuDate,
    meal: Meal // from MealIdentifier
}
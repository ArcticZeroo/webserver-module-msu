import IDiningHallBase from '../IDiningHallBase';
import MenuDate from '../../../lib/submodules/dininghalls/api/MenuDate';

export default interface IMenuDaySelection {
    diningHall: IDiningHallBase;
    menuDate: MenuDate;
}
import IDiningHallBase from './IDiningHallBase';
import IDiningHallHours from './IDiningHallHours';

export default interface IDiningHallWithHours extends IDiningHallBase {
    hours: IDiningHallHours;
}
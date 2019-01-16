import IMealHours from './IMealHours';

export default interface IDiningHallHours {
    sunday: IMealHours[];
    monday: IMealHours[];
    tuesday: IMealHours[];
    wednesday: IMealHours[];
    thursday: IMealHours[];
    friday: IMealHours[];
    saturday: IMealHours[];
}
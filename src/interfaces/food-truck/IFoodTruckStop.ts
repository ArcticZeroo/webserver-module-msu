import Point from '../Point';
export default interface IFoodTruckStop {
    start: number;
    end: number;
    rawLocation: string;
    place: string;
    location: Point;
    isCancelled: boolean;
}
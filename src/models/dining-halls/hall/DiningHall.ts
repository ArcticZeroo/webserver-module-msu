import { model, Model, Document } from 'mongoose';
import IDiningHallWithHours from '../../../interfaces/dining-halls/IDiningHallWithHours';

export interface IDiningHallDocument extends IDiningHallWithHours, Document {

}

export const DiningHall: Model<IDiningHallDocument> = model('MsuDiningHall', );
import { model, Model, Schema, Document } from 'mongoose';

import IMenuItem from '../../../interfaces/dining-halls/menu/IMenuItem';
import IMongoMenuSelection from '../../../interfaces/dining-halls/menu/IMongoMenuSelection';

export interface IMenuItemModel extends Document, IMenuItem, IMongoMenuSelection {

}

export const MenuItem: Model<IMenuItemModel> = model<IMenuItemModel>('MenuItem', );
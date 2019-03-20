import WebserverModule from '@arcticzeroo/webserver-module';
import { Schema } from 'mongoose';


class FoodStorageModule extends WebserverModule {
    private static _foodSchema: Schema = new Schema({
        diningHall: String,
        date: Date,
        meal: Number,

    });

    start(): void {

    }
}
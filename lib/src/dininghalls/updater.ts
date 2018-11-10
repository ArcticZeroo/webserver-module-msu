import WebserverModule from '@arcticzeroo/webserver-module';
import Duration from '@arcticzeroo/duration';
import { DiningHall } from './api/halls';

import { Meal, MealIdentifier } from './enum';
import { MenuDate } from './api/food';
import HallStorageModule from './hall-storage';

const timeBetweenRequests = new Duration({ seconds: 5 });
const timeBetweenBatches = new Duration({ seconds: 30 });

// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};

export default class UpdaterModule extends WebserverModule {
    private _hallStorage: HallStorageModule;

    constructor(data) {
        super(data);

        this._hallStorage = data.hallStorage;
    }

    async loadHall(diningHall: DiningHall, date: Date) {
        const mealKeys = Object.keys(Meal);

        for (let meal = 0; meal < mealKeys.length; ++meal) {

        }
    }

    async loadDay(date: Date) {
        let diningHalls: DiningHall[];
        try {
            diningHalls = await this._hallStorage.retrieve();
        } catch (e) {
            throw e;
        }


    }

    async loadAll() {
        for (let i = DAYS_TO_COLLECT.start; i < DAYS_TO_COLLECT.end; i++) {
            // Offset today by the day we're currently on to get the day we care about...
            // e.g. date + 1 would be tomorrow, you get the point.
            const date = new Date();
            date.setDate(date.getDate() + i);


        }
    }

    start(): void {

    }
}
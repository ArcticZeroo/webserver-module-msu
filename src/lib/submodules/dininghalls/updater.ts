import WebserverModule from '@arcticzeroo/webserver-module';
import Duration from '@arcticzeroo/duration';
import { IWebserverModuleParams } from '@arcticzeroo/webserver-module/WebserverModule';
import IDiningHallWithHours from '../../../interfaces/dining-halls/IDiningHallWithHours';
import IDiningHallMenu from '../../../interfaces/dining-halls/menu/IDiningHallMenu';
import IMenuSelection from '../../../interfaces/dining-halls/menu/IMenuSelection';
import RequireFoodModule from '../../../interfaces/RequireFoodModule';
import RequireHallStorageModule from '../../../interfaces/RequireHallStorageModule';
import { DAYS } from '../../util/DateUtil';
import NodeUtil from '../../util/NodeUtil';
import PromiseUtil from '../../util/PromiseUtil';

import { Meal, MealIdentifier } from './enum';
import { FoodModule, MenuDate } from './api/food';
import HallStorageModule from './hall-storage';

const timeBetweenRequests = new Duration({ seconds: 0.5 });
const timeBetweenBatches = new Duration({ seconds: 5 });
const timeBetweenLoadIntervals = new Duration({ minutes: 15 });

// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};

export default class UpdaterModule extends WebserverModule<RequireHallStorageModule & RequireFoodModule> {
    private async _updateMenu(diningHall: IDiningHallWithHours, date: Date, meal: number): Promise<void> {
        if (diningHall.hours[DAYS[date.getDay()]].closed) {
            return;
        }

        const menuDate = new MenuDate(date);
        const menuSelection: IMenuSelection = { diningHall, meal, menuDate };

        let menu: IDiningHallMenu;
        try {
            menu = await this.data.foodModule.retrieveDiningHallMenuFromWeb(menuSelection);
        } catch (e) {
            throw e;
        }

        this.data.foodModule.cacheMenu(menuSelection, menu);
    }

    async loadHallMealsForDay(diningHall: IDiningHallWithHours, date: Date) {
        const mealKeys = Object.keys(Meal);

        for (let meal = 0; meal < mealKeys.length; ++meal) {
            try {
                await this._updateMenu(diningHall, date, meal);
            } catch (e) {
                continue;
            }

            await PromiseUtil.pause(timeBetweenRequests);
        }
    }

    async loadAllMealsForDay(date: Date) {
        let diningHalls: IDiningHallWithHours[];
        try {
            diningHalls = await this.data.storage.retrieve();
        } catch (e) {
            throw e;
        }

        for (const diningHall of diningHalls) {
            try {
                await this.loadHallMealsForDay(diningHall, date);
            } catch (e) {
                continue;
            }

            await PromiseUtil.pause(timeBetweenBatches);
        }
    }

    async loadAll() {
        for (let i = DAYS_TO_COLLECT.start; i < DAYS_TO_COLLECT.end; i++) {
            // Offset today by the day we're currently on to get the day we care about...
            // e.g. date + 1 would be tomorrow, you get the point.
            const date = new Date();
            date.setDate(date.getDate() + i);

            try {
                await this.loadAllMealsForDay(date);
            } catch (e) {
                continue;
            }

            await PromiseUtil.pause(timeBetweenBatches);
        }
    }

    _doBatch() {
        this.log.debug('Starting batch load');
        this.loadAll().catch(e => this.log.error(`Could not load menu batch: ${e}`));
    }

    _beginLoading() {
        this.log.debug('Beginning loading...');
        NodeUtil.setIntervalImmediate(() => this._doBatch(), timeBetweenLoadIntervals.inMilliseconds);
    }

    start(): void {
        this.data.storage.onReady(() => this._beginLoading());
    }
}
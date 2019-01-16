import WebserverModule from '@arcticzeroo/webserver-module';
import Duration from '@arcticzeroo/duration';
import IDiningHallWithHours from '../../../interfaces/dining-halls/IDiningHallWithHours';
import IDiningHallMenu from '../../../interfaces/dining-halls/menu/IDiningHallMenu';
import IMenuSelection from '../../../interfaces/dining-halls/menu/IMenuSelection';
import RequireFoodModule from '../../../interfaces/RequireFoodModule';
import RequireHallStorageModule from '../../../interfaces/RequireHallStorageModule';
import { DAYS } from '../../util/DateUtil';
import NodeUtil from '../../util/NodeUtil';
import PromiseUtil from '../../util/PromiseUtil';

import {Meal, MealRange} from './enum';
import { MenuDate } from './api/food';

const timeBetweenLoadIntervals = new Duration({ hours: 2 });

// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};

export default class UpdaterModule extends WebserverModule<RequireHallStorageModule & RequireFoodModule> {
    get name(): string {
        return 'UpdaterModule';
    }

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
        for (let meal = MealRange.start; meal < MealRange.end; ++meal) {
            try {
                await this._updateMenu(diningHall, date, meal);
            } catch (e) {
                this.log.error(`Failed to load menu for hall ${this.log.chalk.cyan(diningHall.searchName)} on date ${this.log.chalk.magenta(date.toLocaleDateString())}:`);
                console.error(e);
            }
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

            this.log.debug(`Finished loading day for hall ${diningHall.searchName}`);
        }
    }

    async loadAll() {
        for (let i = DAYS_TO_COLLECT.start; i < DAYS_TO_COLLECT.end; i++) {
            // Offset today by the day we're currently on to get the day we care about...
            // e.g. date + 1 would be tomorrow, you get the point.
            const date = new Date();
            date.setDate(date.getDate() + i);

            this.log.debug(`Loading day ${i}`);

            try {
                await this.loadAllMealsForDay(date);
            } catch (e) {
                continue;
            }

            this.log.debug(`Loaded day index ${i} for all dining halls`);
        }
    }

    _doBatch() {
        this.log.debug('Starting batch load');

        const startTime = Date.now();

        this.loadAll()
            .then(() => {
                const elapsedTimeInMs = Date.now() - startTime;
                const elapsedTimeInMinutes = elapsedTimeInMs / Duration.millisecondsPerMinute;

                this.log.info(`Updated dining hall menus in ${this.log.chalk.magenta(elapsedTimeInMinutes.toFixed(2))} minute(s)`)
            })
            .catch(e => this.log.error(`Could not load menu batch: ${e}`));
    }

    _beginLoading() {
        this.log.info('Beginning loading!');
        NodeUtil.setIntervalImmediate(() => this._doBatch(), timeBetweenLoadIntervals.inMilliseconds);
    }

    start(): void {
        this.data.storage.onReady(() => this._beginLoading());
    }
}
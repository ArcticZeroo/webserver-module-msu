"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const duration_1 = require("@arcticzeroo/duration");
const DateUtil_1 = require("../../util/DateUtil");
const NodeUtil_1 = require("../../util/NodeUtil");
const PromiseUtil_1 = require("../../util/PromiseUtil");
const enum_1 = require("./enum");
const food_1 = require("./api/food");
const timeBetweenRequests = new duration_1.default({ seconds: 0.5 });
const timeBetweenBatches = new duration_1.default({ seconds: 5 });
const timeBetweenLoadIntervals = new duration_1.default({ minutes: 15 });
// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};
class UpdaterModule extends webserver_module_1.default {
    constructor(data) {
        super(data);
        this._hallStorage = data.hallStorage;
        this._foodModule = data.foodModule;
    }
    async _updateMenu(diningHall, date, meal) {
        if (diningHall.hours[DateUtil_1.DAYS[date.getDay()]].closed) {
            return;
        }
        const menuDate = new food_1.MenuDate(date);
        const menuSelection = { diningHall, meal, menuDate };
        let menu;
        try {
            menu = await this._foodModule.retrieveDiningHallMenuFromWeb(menuSelection);
        }
        catch (e) {
            throw e;
        }
        this._foodModule.cacheMenu(menuSelection, menu);
    }
    async loadHallMealsForDay(diningHall, date) {
        const mealKeys = Object.keys(enum_1.Meal);
        for (let meal = 0; meal < mealKeys.length; ++meal) {
            try {
                await this._updateMenu(diningHall, date, meal);
            }
            catch (e) {
                continue;
            }
            await PromiseUtil_1.default.pause(timeBetweenRequests);
        }
    }
    async loadAllMealsForDay(date) {
        let diningHalls;
        try {
            diningHalls = await this._hallStorage.retrieve();
        }
        catch (e) {
            throw e;
        }
        for (const diningHall of diningHalls) {
            try {
                await this.loadHallMealsForDay(diningHall, date);
            }
            catch (e) {
                continue;
            }
            await PromiseUtil_1.default.pause(timeBetweenBatches);
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
            }
            catch (e) {
                continue;
            }
            await PromiseUtil_1.default.pause(timeBetweenBatches);
        }
    }
    _doBatch() {
        this.loadAll().catch(e => this.log.error(`Could not load menu batch: ${e}`));
    }
    _beginLoading() {
        NodeUtil_1.default.setIntervalImmediate(() => this._doBatch(), timeBetweenLoadIntervals.inMilliseconds);
    }
    start() {
        this._hallStorage.onReady(() => this._beginLoading());
    }
}
exports.default = UpdaterModule;
//# sourceMappingURL=updater.js.map
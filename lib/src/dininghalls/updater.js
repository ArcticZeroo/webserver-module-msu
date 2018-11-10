"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const duration_1 = require("@arcticzeroo/duration");
const enum_1 = require("./enum");
const timeBetweenRequests = new duration_1.default({ seconds: 5 });
const timeBetweenBatches = new duration_1.default({ seconds: 30 });
// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};
class UpdaterModule extends webserver_module_1.default {
    constructor(data) {
        super(data);
        this._hallStorage = data.hallStorage;
    }
    async loadHall(diningHall, date) {
        const mealKeys = Object.keys(enum_1.Meal);
        for (let meal = 0; meal < mealKeys.length; ++meal) {
        }
    }
    async loadDay(date) {
        let diningHalls;
        try {
            diningHalls = await this._hallStorage.retrieve();
        }
        catch (e) {
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
    start() {
    }
}
exports.default = UpdaterModule;
//# sourceMappingURL=updater.js.map
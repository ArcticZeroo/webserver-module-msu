"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cheerio = require("cheerio");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const config_1 = require("../../config/");
const DateUtil_1 = require("../util/DateUtil");
const cache_1 = require("../cache");
const retryingRequest_1 = require("../common/retryingRequest");
const legacy_1 = require("./legacy");
const menu_1 = require("./menu");
// TODO: Configured maps locations
/*
*   RegexMatcher.includes('hannah administration'): Point(42.730376, -84.480212),
    RegexMatcher.includes('wells hall'): Point(42.727613, -84.481442),
    RegexMatcher.includes('the rock'): Point(42.728766, -84.477436),
    RegexMatcher.includes('south neighborhood'): Point(42.724038, -84.489300)
* */
function retrieveFoodTruckHtml() {
    return __awaiter(this, void 0, void 0, function* () {
        return retryingRequest_1.default(config_1.default.pages.FOOD_TRUCK);
    });
}
function retrieveStopsFromWeb() {
    return __awaiter(this, void 0, void 0, function* () {
        let page;
        try {
            page = yield cache_1.cache.getValue(cache_1.CacheKey.foodTruckHtml);
        }
        catch (e) {
            throw e;
        }
        const $ = cheerio.load(page);
        const rows = $('.truck-stop-row');
        const stops = [];
        if (!rows || rows.length < 1) {
            return stops;
        }
        rows.each(function () {
            const row = $(this);
            const locMap = row.find('.location-map');
            let location = { x: 0, y: 0 };
            if (locMap) {
                const x = locMap.data('x-coord');
                const y = locMap.data('y-coord');
                if (x && y) {
                    location = { x, y };
                }
                locMap.remove();
            }
            const dates = row.find('time');
            const TimeIdentifier = {
                DATE: 0,
                START_TIME: 1,
                END_TIME: 2
            };
            const dateObj = dates.get(TimeIdentifier.DATE);
            const day = dateObj.children[0].data;
            const start = dates.get(TimeIdentifier.START_TIME);
            const end = dates.get(TimeIdentifier.END_TIME);
            const isCancelled = dateObj.next.data.toLowerCase().includes('cancel');
            const place = dateObj.next.data.replace(/[^\w ,()]/g, '').replace(/(.+?)\s*(\(.*\))/, '$1').trim();
            const stop = {
                start: DateUtil_1.default.createFromFoodTruckString(start.children[0].data, day).getTime(),
                end: DateUtil_1.default.createFromFoodTruckString(end.children[0].data, day).getTime(),
                rawLocation: dateObj.next.data,
                place, location, isCancelled
            };
            stops.push(stop);
        });
        return stops;
    });
}
cache_1.cache.add(cache_1.CacheKey.foodTruckHtml, { fetch: retrieveFoodTruckHtml });
class FoodTruckModule extends webserver_module_1.default {
    start() {
        const router = express.Router();
        router.get('/list', cache_1.handleEndpoint(cache_1.CacheKey.foodTruckStops, retrieveStopsFromWeb));
        this.app.use('/api/msu/foodtruck/', router);
        this.loadChild(menu_1.default);
        this.loadChild(legacy_1.default);
    }
}
exports.default = FoodTruckModule;
//# sourceMappingURL=index.js.map
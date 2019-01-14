import * as express from 'express';
import * as cheerio from 'cheerio';

import WebserverModule from '@arcticzeroo/webserver-module';
import * as config from '../../../config/index';
import DateUtil from '../../util/DateUtil';
import { cache, CacheKey, handleEndpoint } from '../../cache/index';
import request from '../../common/retryingRequest';

import FoodTruckMenuModule from './menu/index';

// TODO: Configured maps locations
/*
*   RegexMatcher.includes('hannah administration'): Point(42.730376, -84.480212),
    RegexMatcher.includes('wells hall'): Point(42.727613, -84.481442),
    RegexMatcher.includes('the rock'): Point(42.728766, -84.477436),
    RegexMatcher.includes('south neighborhood'): Point(42.724038, -84.489300)
* */

async function retrieveFoodTruckHtml() {
    return request(config.pages.FOOD_TRUCK);
}

async function retrieveStopsFromWeb() {
    let page;
    try {
        page = await cache.getValue(CacheKey.foodTruckHtml);
    } catch (e) {
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
            start: DateUtil.createFromFoodTruckString(start.children[0].data, day).getTime(),
            end: DateUtil.createFromFoodTruckString(end.children[0].data, day).getTime(),
            rawLocation: dateObj.next.data,
            place, location, isCancelled
        };

        stops.push(stop);
    });

    return stops;
}

cache.add(CacheKey.foodTruckHtml, { fetch: retrieveFoodTruckHtml });

export default class FoodTruckModule extends WebserverModule {
    static IDENTIFIER = 'Food Truck';

    constructor(data) {
        super({ ...data, name: FoodTruckModule.IDENTIFIER });
    }

    start() {
        const router = express.Router();

        router.get('/list', handleEndpoint(CacheKey.foodTruckStops, retrieveStopsFromWeb));

        this.app.use('/api/msu/foodtruck/', router);

        this.loadChild(FoodTruckMenuModule);
    }
}
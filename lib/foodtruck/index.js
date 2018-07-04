const express = require('express');
const cheerio = require('cheerio');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../config/msu');
const DateUtil = require('../util/DateUtil');
const cache = require('../cache');
const request = require('../common/retryingRequest');
const LegacyModule = require('./legacy');

const cacheKey = 'foodTruck';

async function retrieveStopsFromWeb() {
    let page;
    try {
        page = await request(config.pages.FOOD_TRUCK);
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

cache.add(cacheKey, { expireTime: 15 * 60 * 1000, fetch: retrieveStopsFromWeb });

class FoodTruckModule extends WebserverModule {
    start() {
       const router = express.Router();

       router.get('/list', function (req, res) {
          async function run() {
             let stops;
             try {
                stops = await cache.getValue(cacheKey);
             } catch (e) {
                throw e;
             }

             res.status(200).json(stops);
          }

          run().catch(e => {
             res.status(500).json({ error: 'Internal Server Error' });

             console.error('Could not load food truck stops:');
             console.error(e);
          });
       });

       this.app.use('/api/msu/foodtruck/', router);

       this.loadChild(LegacyModule);
    }
}

module.exports = FoodTruckModule;
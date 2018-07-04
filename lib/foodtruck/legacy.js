const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const dateformat = require('dateformat');
const { ApiAiApp } = require('actions-on-google');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../config/msu');
const prettifyNumber = require('../util/prettifyNumber');
const DateUtil = require('../util/DateUtil');
const cache = require('../cache');

const cacheKey = 'foodTruckLegacy';

async function getFoodTruckPage() {
   return new Promise((resolve, reject) => {
      request({
         uri: config.pages.FOOD_TRUCK,
         rejectUnauthorized: false
      }, (err, res, body) => {
         if (err) {
            if (res && res.statusCode.toString()[0] !== '2') {
               reject(`(${res.statusCode}) ${err}`);
            } else {
               reject(err);
            }
            return;
         }

         if (!res) {
            reject('Response is empty.');
            return;
         }

         if (res.statusCode.toString()[0] !== '2') {
            reject(res.statusCode);
            return;
         }

         resolve(body);
      });
   });
}

function getStateDateString() {
   return dateformat(new Date(), 'dddd, mmmm dS');
}

async function getTruckStops() {
   let page;
   try {
      page = await getFoodTruckPage();
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

      const place = dateObj.next.data.replace(/[^\w ,()]/g, '').replace(/(.+?)\s*(\(.*\))/, '$1').trim();

      const stop = {
         start: DateUtil.createFromFoodTruckString(start.children[0].data, day).getTime(),
         end: DateUtil.createFromFoodTruckString(end.children[0].data, day).getTime(),
         today: (day === getStateDateString()),
         place, location
      };

      stops.push(stop);
   });

   return stops;
}

cache.add(cacheKey, { expireTime: 15 * 60 * 1000, fetch: getTruckStops });

function getDateFromStringTime(time) {
   const startSplit = time.split(' ');

   const timeSplit = startSplit[0].split(':');

   let hours = parseInt(timeSplit[0]);
   const minutes = parseInt(timeSplit[1]);

   const suffix = startSplit[1];

   if (suffix.toUpperCase().trim() === 'PM') {
      hours += 12;
   }

   const date = new Date();

   date.setHours(hours, minutes, 0, 0);

   return date;
}

const router = express.Router();

router.post('/where', function (req, res) {
   const app = new ApiAiApp({ request: req, response: res });

   async function go() {
      let stops;
      try {
         stops = await cache.getValue(cacheKey);
      } catch (e) {
         app.tell('Sorry, but I couldn\'t check the food truck location right now. Try again later.');
         return;
      }

      if (!stops || stops.length < 1) {
         app.tell('The truck has no stops listed for today.');
         return;
      }

      const stopText = [];

      for (let i = 0; i < stops.length; i++) {
         const stop = stops[i];

         if (stop.place.toLowerCase().includes('cancelled')) {
            stopText.push(`The ${prettifyNumber(i + 1)} has been cancelled.`);
            continue;
         }

         if (Date.now() > stop.end) {
            stopText.push(`The ${prettifyNumber(i + 1)} left at ${new Date(stop.end).toLocaleTimeString()}.`);
            continue;
         }

         stopText.push(`The ${prettifyNumber(i + 1)} is at ${stop.place} from ${new Date(stop.start).toLocaleTimeString()} to ${new Date(stop.end).toLocaleTimeString()}.`);
      }

      app.tell(`The food truck has ${stops.length} stop${stops.length === 1 ? '' : 's'} today. ${stopText.join(' ')}`);
   }

   go().catch(e => {
      res.status(500).json({
         error: 'Internal Server Error'
      });

      console.error('Could not load food truck stops:');
      console.error(e);
   });
});

router.get('/where', function (req, res) {
   async function run() {
      let stops;
      try {
         stops = await cache.getValue(cacheKey);
      } catch (e) {
         throw e;
      }

      res.status(200).json({ stops, dateString: getStateDateString() });
   }

   run().catch(e => {
      res.status(500).json({
         error: 'Internal Server Error'
      });

      console.error('Could not load food truck stops:');
      console.error(e);
   });
});

class FoodTruckLegacyModule extends WebserverModule {
   start() {
      this.app.use('/api/foodtruck/', router);
   }
}

module.exports = FoodTruckLegacyModule;
const express = require('express');
const WebserverModule = require('@arcticzeroo/webserver-module');

const storage = require('./hall-storage');
const food = require('./data/food');
const api = require('./api');
const log = require('./logger');

class DiningHallModule extends WebserverModule {
   constructor(...data) {
      super(...data);
   }

   start() {
      const router = express.Router();

      router.get('/list', function (req, res) {
         async function go() {
            res.json(await storage.retrieve());
         }

         go().catch(e => {
            res.status(500).json({
               error: 'Internal Server Error'
            });

            console.error('Could not load dining halls:');
            console.error(e);
         });
      });

      router.get('/menu/:search/:date/:meal', function (req, res) {
         async function go() {
            const { search, date, meal } = req.params;

            log.debug(`search:${search}, date:${date}, meal:${meal}`);

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
               return res.status(400).json({ error: 'Bad Request', message: 'Invalid date value.' });
            }

            log.debug('Date is valid');

            let validMeal = true;
            if (isNaN(meal)) {
               validMeal = false;
            } else {
               const mealNum = parseInt(meal);

               validMeal = mealNum >= 0 && mealNum < Object.keys(api.Meal).length;
            }

            if (!validMeal) {
               return res.status(400).json({ error: 'Bad Request', message: 'Invalid meal value.' });
            }

            log.debug('Meal is valid');

            let foundHall;
            try {
               foundHall = await storage.findBySearchName(search);
            } catch (e) {
               throw e;
            }

            if (!foundHall) {
               return res.status(400).json({ error: 'Bad Request', message: 'Invalid dining hall search value.' });
            }

            log.debug(`Found ${foundHall.fullName}`);

            let menuData;
            try {
               menuData = await food.retrieveMenu(foundHall, food.MenuDate.fromFormatted(date), parseInt(meal));
            } catch (e) {
               log.error(`Could not get menu for ${foundHall.hallName}:`);
               console.error(e);
               return res.status(500).json({ error: 'Internal Server Error' });
            }

            res.json(menuData);
         }

         go().catch(e => {
            res.status(500).json({
               error: 'Internal Server Error'
            });

            console.error(`Could not load dining hall menu for term ${search}:`);
            console.error(e);
         });
      });

      this.app.use('/api/msu/dining', router);
   }
}
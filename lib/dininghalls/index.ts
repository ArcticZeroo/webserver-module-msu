/* eslint-disable no-console */
import WebserverModule from '@arcticzeroo/webserver-module';
import * as express from 'express';
import HallStorageModule from './hall-storage';
import { FoodModule, MenuDate } from './api/food';
import * as api from './enum';
import log from './logger';

class DiningHallModule extends WebserverModule {
    static IDENFITIER: string = 'diningHallModule';

    constructor(data) {
        super({
            ...data,
            startByDefault: false,
            name: DiningHallModule.IDENFITIER
        });

        for (const child of [ HallStorageModule, FoodModule ]) {
            this.loadChild(child, { storage: this.hallStorage });
        }

        this.start();
    }

    get hallStorage(): HallStorageModule {
        return this.children.get(HallStorageModule.IDENTIFIER);
    }

    get food(): FoodModule {
        return this.children.get(FoodModule.IDENTIFIER);
    }

    start(): void {
        const router = express.Router();

        router.get('/list', (req, res) => {
            const go = async () => {
                try {
                    res.json(await this.hallStorage.retrieve());
                } catch (e) {
                    throw e;
                }
            };

            go().catch(e => {
                res.status(500).json({
                    error: 'Internal Server Error'
                });

                console.error('Could not load dining halls:');
                console.error(e);
            });
        });

        router.get('/menu/all/:date/', (req, res) => {
            const { date } = req.params;

            const go = async () => {
                if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid date value.' });
                }

                log.debug('Date is valid');

                const hallMenus = {};

                let halls;
                try {
                    halls = await this.hallStorage.retrieve();
                } catch (e) {
                    throw new Error('Could not load halls');
                }

                const hallMenuPromises = [];
                for (const hall of halls) {
                    const menuDataPromises = [];
                    const menuDate = MenuDate.fromFormatted(date);
                    const mealCount = Object.keys(api.Meal).length;

                    for (let i = 0; i < mealCount; i++) {
                        menuDataPromises.push(this.food.retrieveMenu(hall, menuDate, i));
                    }

                    hallMenuPromises.push(Promise.all(menuDataPromises).then(data => hallMenus[hall.searchName] = data));
                }

                try {
                    await Promise.all(hallMenuPromises);
                } catch (e) {
                    throw e;
                }

                res.json(hallMenus);
            };

            go().catch(e => {
                res.status(500).json({
                    error: 'Internal Server Error'
                });

                console.error('Could not load dining hall menus:');
                console.error(e);
            });
        });

        router.get('/menu/:search/:date/all', (req, res) => {
            const { search, date } = req.params;

            const go = async () => {
                log.debug(`search:${search}, date:${date}`);

                if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid date value.' });
                }

                log.debug('Date is valid');

                let foundHall;
                try {
                    foundHall = await this.hallStorage.findBySearchName(search);
                } catch (e) {
                    throw e;
                }

                if (!search || !foundHall) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid dining hall search value.' });
                }

                log.debug(`Found ${foundHall.fullName}`);

                const menuDataPromises = [];
                const menuDate = MenuDate.fromFormatted(date);
                const mealCount = Object.keys(api.Meal).length;
                for (let i = 0; i < mealCount; i++) {
                    menuDataPromises.push(this.food.retrieveMenu(foundHall, menuDate, i));
                }

                let menuData;
                try {
                    menuData = await Promise.all(menuDataPromises);
                } catch (e) {
                    log.error(`Could not get menus for ${foundHall.hallName}:`);
                    console.error(e);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                res.json(menuData);
            };

            go().catch(e => {
                res.status(500).json({
                    error: 'Internal Server Error'
                });

                console.error(`Could not load dining hall menus for term ${search}:`);
                console.error(e);
            });
        });

        router.get('/menu/:search/:date/:meal', (req, res) => {
            const { search, date, meal } = req.params;

            const go = async () => {
                log.debug(`search:${search}, date:${date}, meal:${meal}`);

                if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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
                    foundHall = await this.hallStorage.findBySearchName(search);
                } catch (e) {
                    throw e;
                }

                if (!search || !foundHall) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid dining hall search value.' });
                }

                log.debug(`Found ${foundHall.fullName}`);

                let menuData;
                try {
                    menuData = await this.food.retrieveMenu(foundHall, MenuDate.fromFormatted(date), parseInt(meal));
                } catch (e) {
                    log.error(`Could not get menu for ${foundHall.hallName}:`);
                    console.error(e);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                res.json(menuData);
            };

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

module.exports = DiningHallModule;
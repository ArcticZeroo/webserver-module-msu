"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const express = require("express");
const hall_storage_1 = require("./hall-storage");
const food_1 = require("./api/food");
const api = require("./enum");
const logger_1 = require("./logger");
const updater_1 = require("./updater");
class DiningHallModule extends webserver_module_1.default {
    constructor(data) {
        super(Object.assign({}, data, { startByDefault: false, name: DiningHallModule.IDENFITIER }));
        for (const child of [hall_storage_1.default, food_1.FoodModule, updater_1.default]) {
            this.loadChild(child, { storage: this.hallStorage });
        }
        this.start();
    }
    get hallStorage() {
        return this.children.get(hall_storage_1.default.IDENTIFIER);
    }
    get food() {
        return this.children.get(food_1.FoodModule.IDENTIFIER);
    }
    start() {
        const router = express.Router();
        router.get('/list', (req, res) => {
            const go = async () => {
                try {
                    res.json(await this.hallStorage.retrieve());
                }
                catch (e) {
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
                logger_1.default.debug('Date is valid');
                const hallMenus = {};
                let halls;
                try {
                    halls = await this.hallStorage.retrieve();
                }
                catch (e) {
                    throw new Error('Could not load halls');
                }
                const hallMenuPromises = [];
                for (const hall of halls) {
                    const menuDataPromises = [];
                    const menuDate = food_1.MenuDate.fromFormatted(date);
                    const mealCount = Object.keys(api.Meal).length;
                    for (let i = 0; i < mealCount; i++) {
                        menuDataPromises.push(this.food.retrieveMenu(hall, menuDate, i));
                    }
                    hallMenuPromises.push(Promise.all(menuDataPromises).then(data => hallMenus[hall.searchName] = data));
                }
                try {
                    await Promise.all(hallMenuPromises);
                }
                catch (e) {
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
                logger_1.default.debug(`search:${search}, date:${date}`);
                if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid date value.' });
                }
                logger_1.default.debug('Date is valid');
                let foundHall;
                try {
                    foundHall = await this.hallStorage.findBySearchName(search);
                }
                catch (e) {
                    throw e;
                }
                if (!search || !foundHall) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid dining hall search value.' });
                }
                logger_1.default.debug(`Found ${foundHall.fullName}`);
                const menuDataPromises = [];
                const menuDate = food_1.MenuDate.fromFormatted(date);
                const mealCount = Object.keys(api.Meal).length;
                for (let i = 0; i < mealCount; i++) {
                    menuDataPromises.push(this.food.retrieveMenu(foundHall, menuDate, i));
                }
                let menuData;
                try {
                    menuData = await Promise.all(menuDataPromises);
                }
                catch (e) {
                    logger_1.default.error(`Could not get menus for ${foundHall.hallName}:`);
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
                logger_1.default.debug(`search:${search}, date:${date}, meal:${meal}`);
                if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid date value.' });
                }
                logger_1.default.debug('Date is valid');
                let validMeal = true;
                if (isNaN(meal)) {
                    validMeal = false;
                }
                else {
                    const mealNum = parseInt(meal);
                    validMeal = mealNum >= 0 && mealNum < Object.keys(api.Meal).length;
                }
                if (!validMeal) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid meal value.' });
                }
                logger_1.default.debug('Meal is valid');
                let foundHall;
                try {
                    foundHall = await this.hallStorage.findBySearchName(search);
                }
                catch (e) {
                    throw e;
                }
                if (!search || !foundHall) {
                    return res.status(400).json({ error: 'Bad Request', message: 'Invalid dining hall search value.' });
                }
                logger_1.default.debug(`Found ${foundHall.fullName}`);
                let menuData;
                try {
                    menuData = await this.food.retrieveMenu(foundHall, food_1.MenuDate.fromFormatted(date), parseInt(meal));
                }
                catch (e) {
                    logger_1.default.error(`Could not get menu for ${foundHall.hallName}:`);
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
DiningHallModule.IDENFITIER = 'diningHallModule';
exports.default = DiningHallModule;
//# sourceMappingURL=index.js.map
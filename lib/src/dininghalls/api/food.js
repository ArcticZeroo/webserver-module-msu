"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const expiring_cache_1 = require("expiring-cache");
const dateFormat = require("dateformat");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const retryingRequest_1 = require("../../common/retryingRequest");
const config = require("../../../../config");
const enum_1 = require("../enum");
class MenuDate {
    constructor(initial) {
        this.date = initial || new Date();
    }
    getFormatted() {
        return dateFormat(this.date, 'yyyy-mm-dd');
    }
    forward() {
        this.date.setDate(this.date.getDate() + 1);
    }
    back() {
        this.date.setDate(this.date.getDate() - 1);
    }
    today() {
        this.date = new Date();
    }
    static fromFormatted(str) {
        const split = str.split('-').map(s => parseInt(s.replace(/^0+(\d+)/, '$1')));
        split[1] -= 1;
        const date = new Date();
        // @ts-ignore - not sure how this worked before but I'll allow it
        date.setFullYear(...split);
        return new MenuDate(date);
    }
}
exports.MenuDate = MenuDate;
class FoodModule extends webserver_module_1.default {
    constructor(data) {
        super(Object.assign({}, data, { name: FoodModule.IDENTIFIER, startByDefault: false }));
        this.storage = data.storage;
        this.cache = new expiring_cache_1.default(async (key) => this.getDiningHallMenu(await this.deserializeFromKey(key)), 12 * 60 * 60 * 1000);
    }
    static serializeToKey({ diningHall, menuDate, meal }) {
        return [diningHall.searchName, menuDate.getFormatted(), meal].join('|');
    }
    async deserializeFromKey(key) {
        const [searchName, date, meal] = key.split('|');
        let diningHall;
        try {
            diningHall = await this.storage.findBySearchName(searchName);
        }
        catch (e) {
            throw e;
        }
        return { diningHall, menuDate: MenuDate.fromFormatted(date), meal: parseInt(meal) };
    }
    static getRequestUrl({ diningHall, menuDate, meal }) {
        return encodeURI(`${config.pages.EAT_AT_STATE + config.pages.DINING_HALL_MENU + diningHall.fullName}/all/${menuDate.getFormatted()}?field_mealtime_target_id=${enum_1.MealIdentifier.getByIndex(meal)}`);
    }
    async getDiningHallMenu({ diningHall, menuDate, meal }) {
        const url = FoodModule.getRequestUrl({ diningHall, menuDate, meal });
        let body;
        try {
            body = await retryingRequest_1.default(url);
        }
        catch (e) {
            throw e;
        }
        const $ = cheerio.load(body);
        const mainText = $('.views-exposed-form')[0].nextSibling.data.trim();
        if (mainText.toLowerCase().includes('closed')) {
            return { closed: true, venues: [] };
        }
        const places = $('.eas-list');
        const venues = [];
        places.each(function () {
            const $place = $(this);
            let venueName = $($place.find('.venue-title')[0]).text();
            venueName = venueName[0].toUpperCase() + venueName.substr(1).toLowerCase();
            const descriptionElems = $place.find('.venue-description > p')[0];
            const description = descriptionElems ? descriptionElems.children[0].data : null;
            const menuItems = $place.find('.menu-item');
            const menu = [];
            menuItems.each(function () {
                const $menuItem = $(this);
                const name = $($menuItem.find('.meal-title')[0]).text();
                const diningPrefItems = $menuItem.find('.dining-prefs');
                const diningPrefs = [];
                diningPrefItems.each(function () {
                    const split = $(this).text().split(', ');
                    if (!split || !split.length || !split[0]) {
                        return;
                    }
                    diningPrefs.push(...split);
                });
                const allergensRaw = $($menuItem.find('.allergens')[0]).text().trim();
                let allergens = [];
                if (allergensRaw.length) {
                    const split = allergensRaw.replace(/^contains:\s+/i, '').split(', ');
                    if (split.length && split[0]) {
                        allergens = split;
                    }
                }
                menu.push({ name, preferences: diningPrefs, allergens });
            });
            venues.push({ venueName, description, menu });
        });
        return { closed: false, venues };
    }
    retrieveMenu(diningHall, menuDate, meal) {
        return this.cache.getEntry(FoodModule.serializeToKey({ diningHall, menuDate, meal }));
    }
    start() {
    }
}
FoodModule.IDENTIFIER = 'foodModule';
exports.FoodModule = FoodModule;
//# sourceMappingURL=food.js.map
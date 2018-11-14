import * as cheerio from 'cheerio';
import ExpiringCache from 'expiring-cache';
import * as dateFormat from 'dateformat';
import WebserverModule from '@arcticzeroo/webserver-module';
import IDiningHallBase from '../../../interfaces/dining-halls/IDiningHallBase';
import IDiningHallMenu from '../../../interfaces/dining-halls/menu/IDiningHallMenu';
import IMenuSelection from '../../../interfaces/dining-halls/menu/IMenuSelection';

import request from '../../../common/retryingRequest';
import * as config from '../../../../config/index';
import { Meal, MealIdentifier } from '../enum';
import HallStorageModule from '../hall-storage';

class MenuDate {
    private _date: Date;
    
    constructor(initial?: Date) {
        this._date = initial || new Date();
    }

    get date() {
        return new Date(this._date);
    }

    getFormatted(): string {
        return dateFormat(this._date, 'yyyy-mm-dd');
    }

    forward(): void {
        this._date.setDate(this._date.getDate() + 1);
    }

    back(): void {
        this._date.setDate(this._date.getDate() - 1);
    }

    today(): void {
        this._date = new Date();
    }

    static fromFormatted(str: string): MenuDate {
        const split = str.split('-').map(s => parseInt(s.replace(/^0+(\d+)/, '$1')));
        split[1] -= 1;

        const date = new Date();
        // @ts-ignore - not sure how this worked before but I'll allow it
        date.setFullYear(...split);

        return new MenuDate(date);
    }
}

class FoodModule extends WebserverModule {
    /**
     * Using a local cache instead of an expiring-per-item-cache because ExpiringCache allows for values to be retrieved
     * with dynamic keys but static fetch methods, vs the per item cache which requires a key to be registered
     * beforehand since each key has its own fetch method
     */
    private cache: ExpiringCache<string, IDiningHallMenu>;
    private storage: HallStorageModule;

    constructor(data) {
        super({ ...data, name: FoodModule.IDENTIFIER, startByDefault: false });

        this.storage = data.storage;

        this.cache = new ExpiringCache(
            async key => this.retrieveDiningHallMenuFromWeb(await this.deserializeFromKey(key)),
            12 * 60 * 60 * 1000
        );
    }

    static serializeToKey({ diningHall, menuDate, meal } : IMenuSelection): string {
        return [diningHall.searchName, menuDate.getFormatted(), meal].join('|');
    }

    async deserializeFromKey(key: string): Promise<IMenuSelection> {
        const [searchName, date, meal] = key.split('|');

        let diningHall;
        try {
            diningHall = await this.storage.findBySearchName(searchName);
        } catch (e) {
            throw e;
        }

        return { diningHall, menuDate: MenuDate.fromFormatted(date), meal: parseInt(meal) };
    }

    static getRequestUrl({ diningHall, menuDate, meal } : IMenuSelection): string {
        return encodeURI(`${config.pages.EAT_AT_STATE + config.pages.DINING_HALL_MENU + diningHall.fullName}/all/${menuDate.getFormatted()}?field_mealtime_target_id=${MealIdentifier.getByIndex(meal)}`);
    }

    async retrieveDiningHallMenuFromWeb({ diningHall, menuDate, meal } : IMenuSelection): Promise<IDiningHallMenu> {
        const url = FoodModule.getRequestUrl({ diningHall, menuDate, meal });

        let body;
        try {
            body = await request(url);
        } catch (e) {
            throw e;
        }

        const $ = cheerio.load(body);

        const mainText = $('.views-exposed-form')[0].nextSibling.data.trim();

        if (mainText.toLowerCase().includes('closed')) {
            return { closed: true, venues: [] };
        }

        const places = $('.eas-list');

        const venues = [];

        places.each(function() {
            const $place = $(this);

            let venueName = $($place.find('.venue-title')[0]).text();
            venueName = venueName[0].toUpperCase() + venueName.substr(1).toLowerCase();

            const descriptionElems = $place.find('.venue-description > p')[0];

            const description = descriptionElems ? descriptionElems.children[0].data : null;

            const menuItems = $place.find('.menu-item');

            const menu = [];

            menuItems.each(function() {
                const $menuItem = $(this);

                const name = $($menuItem.find('.meal-title')[0]).text();

                const diningPrefItems = $menuItem.find('.dining-prefs');

                const diningPrefs = [];

                diningPrefItems.each(function() {
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

    retrieveMenu(diningHall: IDiningHallBase, menuDate: MenuDate, meal: number): Promise<IDiningHallMenu> {
        return this.cache.getEntry(FoodModule.serializeToKey({ diningHall, menuDate, meal }));
    }

    cacheMenu(menuSelection: IMenuSelection, menu: IDiningHallMenu) {
        this.cache.set(FoodModule.serializeToKey(menuSelection), menu);
    }

    static IDENTIFIER: string = 'foodModule';

    start(): void {

    }
}

export { FoodModule, MenuDate }
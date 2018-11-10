import * as cheerio from 'cheerio';
import ExpiringCache from 'expiring-cache';
import * as dateFormat from 'dateformat';
import WebserverModule from '@arcticzeroo/webserver-module';

import request from '../../common/retryingRequest';
import * as config from '../../../../config';
import { Meal, MealIdentifier } from '../enum';
import HallStorageModule from '../hall-storage';
import { DiningHall } from './halls';

interface MenuItem {
    name: string,
    preferences: string[],
    allergens: string[]
}

interface FoodVenue {
    name: string,
    description: string,
    menu: MenuItem[]
}

interface DiningHallMenu {
    closed: boolean,
    venues: FoodVenue[]
}

interface MenuSelection {
    diningHall: DiningHall,
    menuDate: MenuDate,
    meal: number // from MealIdentifier
}

class MenuDate {
    private date: Date;
    
    constructor(initial?: Date) {
        this.date = initial || new Date();
    }

    getFormatted(): string {
        return dateFormat(this.date, 'yyyy-mm-dd');
    }

    forward(): void {
        this.date.setDate(this.date.getDate() + 1);
    }

    back(): void {
        this.date.setDate(this.date.getDate() - 1);
    }

    today(): void {
        this.date = new Date();
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
    private cache: ExpiringCache<string, DiningHallMenu>;
    private storage: HallStorageModule;

    constructor(data) {
        super({ ...data, name: FoodModule.IDENTIFIER, startByDefault: false });

        this.storage = data.storage;

        this.cache = new ExpiringCache(
            async key => this.getDiningHallMenu(await this.deserializeFromKey(key)),
            12 * 60 * 60 * 1000
        );
    }

    static serializeToKey({ diningHall, menuDate, meal } : MenuSelection): string {
        return [diningHall.searchName, menuDate.getFormatted(), meal].join('|');
    }

    async deserializeFromKey(key: string): Promise<MenuSelection> {
        const [searchName, date, meal] = key.split('|');

        let diningHall;
        try {
            diningHall = await this.storage.findBySearchName(searchName);
        } catch (e) {
            throw e;
        }

        return { diningHall, menuDate: MenuDate.fromFormatted(date), meal: parseInt(meal) };
    }

    static getRequestUrl({ diningHall, menuDate, meal } : MenuSelection): string {
        return encodeURI(`${config.pages.EAT_AT_STATE + config.pages.DINING_HALL_MENU + diningHall.fullName}/all/${menuDate.getFormatted()}?field_mealtime_target_id=${MealIdentifier.getByIndex(meal)}`);
    }

    async getDiningHallMenu({ diningHall, menuDate, meal } : MenuSelection): Promise<DiningHallMenu> {
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

    retrieveMenu(diningHall: DiningHall, menuDate: MenuDate, meal: number): Promise<DiningHallMenu> {
        return this.cache.getEntry(FoodModule.serializeToKey({ diningHall, menuDate, meal }));
    }

    static IDENTIFIER: string = 'foodModule';

    start(): void {

    }
}

export { FoodModule, MenuDate }
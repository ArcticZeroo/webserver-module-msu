const cheerio = require('cheerio');
const ExpiringCache = require('expiring-cache');
const dateFormat = require('dateformat');
const WebserverModule = require('@arcticzeroo/webserver-module');

const request = require('../../common/retryingRequest');
const config = require('../../../config/');
const { MealIdentifier } = require('../enum');

const SECONDS_PER_DAY = 24 * 60 * 60;

const MenuItem = {
    name: String,
    preferences: [String],
    allergens: [String]
};

const FoodVenue = {
    name: 'String',
    description: 'String',
    menu: [MenuItem]
};

const DiningHallMenu = {
    closed: Boolean,
    venues: []
};

class MenuDate {
    constructor(initial) {
        this.date = initial ? initial : new Date();
    }

    getFormatted() {
        return dateFormat(this.date, 'yyyy-mm-dd');
    }

    addTime(amount = SECONDS_PER_DAY) {
        this.date.setUTCMilliseconds(this.date.getTime() + amount);
    }

    forward() {
        this.addTime();
    }

    back() {
        this.addTime(-SECONDS_PER_DAY);
    }

    today() {
        this.date = new Date();
    }

    static fromFormatted(str) {
        const split = str.split('-').map(s => parseInt(s.replace(/^0+(\d+)/, '$1')));
        split[1] -= 1;

        const date = new Date();
        date.setFullYear(...split);

        return new MenuDate(date);
    }
}

class FoodModule extends WebserverModule {
    constructor(data) {
        super({ ...data, name: FoodModule.IDENTIFIER, startByDefault: false });

        this.storage = data.storage;

        this.cache = new ExpiringCache(
            async key => this.getDiningHallMenu(await this.deserializeFromKey(key)),
            12 * 60 * 60 * 1000
        );
    }

    serializeToKey({ diningHall, menuDate, meal }) {
        return [diningHall.searchName, menuDate.getFormatted(), meal].join('|');
    }

    async deserializeFromKey(key) {
        const [searchName, date, meal] = key.split('|');

        let diningHall;
        try {
            diningHall = await this.storage.findBySearchName(searchName);
        } catch (e) {
            throw e;
        }

        return { diningHall, menuDate: MenuDate.fromFormatted(date), meal };
    }

    getRequestUrl({ diningHall, date, meal }) {
        return encodeURI(`${config.pages.EAT_AT_STATE + config.pages.DINING_HALL_MENU + diningHall.fullName}/all/${date}?field_mealtime_target_id=${MealIdentifier.getByIndex(meal)}`);
    }

    async getDiningHallMenu({ diningHall, menuDate, meal }) {
        const url = this.getRequestUrl({ diningHall, date: menuDate.getFormatted(), meal });

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

    retrieveMenu(diningHall, menuDate, meal) {
        return this.cache.getEntry(this.serializeToKey({ diningHall, menuDate, meal }));
    }
}

FoodModule.IDENTIFIER = 'foodModule';

module.exports = { FoodModule, MenuDate };
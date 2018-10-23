const express = require('express');
const cheerio = require('cheerio');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../../config');
const DateUtil = require('../../util/DateUtil');
const cache = require('../../cache');
const request = require('../../common/retryingRequest');

const MENU_TITLE_REGEX = /^(.+?)\s+(?:service)?\s*menu(?: \| (.+?) ([\d-]+)(?:,\s+)?(\d+))?$/i;
// text, name, month, dates, year
const MENU_NAME_AND_PRICE_REGEX = /(.+?)\*?[ \s]-\s+\$([\d.]+)/;

class FoodTruckMenuModule extends WebserverModule {
    static isTag($elem, tag) {
        return $elem.prop('tagName').toLowerCase() === tag.toLowerCase();
    }

    static parseMenuItemFromListEntry($, $listEntry) {
        const children = $listEntry.children('p');

        const nameAndPrice = $(children.children()[0]).text();
        const description = $(children.children()[2]).text();

        if (!MENU_NAME_AND_PRICE_REGEX.test(nameAndPrice)) {
            return null;
        }

        const [, name, price] = nameAndPrice.match(MENU_NAME_AND_PRICE_REGEX);

        // Leave price as a string since json doesn't allow floats
        return { name, price, description };
    }

    static parseMenuItemsFromList($, menuListElements) {
        const menuItems = [];

        for (let i = 0; i < menuListElements.length; i++) {
            menuItems.push(FoodTruckMenuModule.parseMenuItemFromListEntry($, $(menuListElements[i])));
        }

        return menuItems;
    }

    static parseSingleMenuData($, titleText, $menuList) {
        if (!MENU_TITLE_REGEX.test(titleText)) {
            return null;
        }

        const match = titleText.match(MENU_TITLE_REGEX);
        const menuName = match[1].toLowerCase();

        const menuItemElements = $menuList.find('li');

        const menuItems = FoodTruckMenuModule.parseMenuItemsFromList($, menuItemElements);

        return { title: menuName, items: menuItems };
    }

    static async retrieveMenusFromWeb() {
        let htmlResponse;
        try {
            htmlResponse = await request(config.pages.FOOD_TRUCK);
        } catch (e) {
            throw e;
        }

        const $ = cheerio.load(htmlResponse);

        const $menuData = $('footer .field-content');

        const parsedMenus = [];

        const menuChildren = $menuData.children();

        const menuChildrenCount = menuChildren.length;

        /**
         * .field-content contains a bunch of elements, like <h2> and <p> and <ul>s. Each <h2> is paired with a few <ul>s
         * that represent the menu items, however only the first <ul> element actually represents the "main" menu items, and
         * the rest only represent sides/drinks/etc. so we ignore them (at least for v1 of the api)
         *
         */
        for (let i = 0; i < menuChildrenCount; i++) {
            const $potentialTitle = $(menuChildren[i]);

            if (FoodTruckMenuModule.isTag($potentialTitle, 'h2')) {
                for (++i; i < menuChildrenCount; i++) {
                    const $potentialMenuList = $(menuChildren[i]);

                    if (FoodTruckMenuModule.isTag($potentialMenuList, 'ul')) {
                        parsedMenus.push(FoodTruckMenuModule.parseSingleMenuData($, $potentialTitle.text(), $potentialMenuList));
                        break;
                    }
                }
            }
        }

        return parsedMenus;
    }

    start() {
        const router = express.Router();

        router.get('/api/msu/foodtruck/menu', cache.handleEndpoint('foodTruck_menu', () => FoodTruckMenuModule.retrieveMenusFromWeb()));

        this.app.use(router);
    }
}

module.exports = FoodTruckMenuModule;
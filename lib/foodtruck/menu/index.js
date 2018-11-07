"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cheerio = require("cheerio");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const cache_1 = require("../../cache");
const MENU_TITLE_REGEX = /^(.+?)\s+(?:service)?\s*menu(?: \| (.+?) ([\d-]+)(?:,\s+)?(\d+))?$/i;
// text, name, month, dates, year
const MENU_NAME_AND_PRICE_REGEX = /(.+?)\*?[ \s]-\s+\$([\d.]+)/;
const PRICE_KILL_DESCRIPTION_REGEX = /\$(\d+(?:\.\d+)?)\s*(.+)/;
class FoodTruckMenuModule extends webserver_module_1.default {
    static isTag($elem, tag) {
        return $elem.prop('tagName').toLowerCase() === tag.toLowerCase();
    }
    static parseMenuItemFromListEntry($, $listEntry) {
        const children = $listEntry.children('p');
        const nameAndPrice = $(children.children()[0]).text();
        const descriptionAndPrice = children.find('em').text();
        if (!MENU_NAME_AND_PRICE_REGEX.test(nameAndPrice) || !PRICE_KILL_DESCRIPTION_REGEX.test(descriptionAndPrice)) {
            return null;
        }
        const [, name, price] = nameAndPrice.match(MENU_NAME_AND_PRICE_REGEX);
        const [, , description] = descriptionAndPrice.match(PRICE_KILL_DESCRIPTION_REGEX);
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
    static retrieveMenusFromWeb() {
        return __awaiter(this, void 0, void 0, function* () {
            let htmlResponse;
            try {
                htmlResponse = yield cache_1.default.getValue(cache_1.default.keys.foodTruckHtml);
            }
            catch (e) {
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
        });
    }
    start() {
        const router = express.Router();
        router.get('/api/msu/foodtruck/menu', cache_1.default.handleEndpoint(cache_1.default.keys.foodTruckMenu, () => FoodTruckMenuModule.retrieveMenusFromWeb()));
        this.app.use(router);
    }
}
module.exports = FoodTruckMenuModule;
//# sourceMappingURL=index.js.map
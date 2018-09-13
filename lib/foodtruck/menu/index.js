const express = require('express');
const cheerio = require('cheerio');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../../config');
const DateUtil = require('../util/DateUtil');
const cache = require('../cache');
const request = require('../common/retryingRequest');

class FoodTruckMenuModule extends WebserverModule {
    static async retrieveMenusFromWeb() {
        let htmlResponse;
        try {
            htmlResponse = await request(config.pages.FOOD_TRUCK);
        } catch (e) {
            throw e;
        }

        const $ = cheerio.load(htmlResponse);

        const menuData = $('footer');


    }
}
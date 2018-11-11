"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../cache");
const express = require("express");
const cheerio = require("cheerio");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const config_1 = require("../../../config/");
const retryingRequest_1 = require("../../common/retryingRequest");
class UabModule extends webserver_module_1.default {
    constructor(data) {
        super(Object.assign({}, data, { name: UabModule.IDENTIFIER }));
    }
    static async retrieveSingleCalendarEventFromWeb(url) {
        let htmlResponse;
        try {
            htmlResponse = await retryingRequest_1.default(config_1.default.pages.UAB_EVENT_BASE + url);
        }
        catch (e) {
            throw e;
        }
        const $ = cheerio.load(htmlResponse);
        const title = $('#page-title').text();
        let startTime = new Date($('.date-display-start').attr('content')).getTime();
        const endTime = new Date($('.date-display-end').attr('content')).getTime();
        const fallbackDateDisplay = $('.date-display-single');
        const isAllDay = fallbackDateDisplay.text().toLowerCase().includes('all day') && !startTime && !endTime;
        if (!startTime && !isAllDay) {
            const fallbackDateString = fallbackDateDisplay.attr('content');
            // There is no end time listed, only a start time, so it's OK if it's null
            if (fallbackDateString && fallbackDateString.trim()) {
                startTime = new Date(fallbackDateString).getTime();
            }
        }
        const descriptionDataElements = $('.field-name-body .field-item p');
        const expectedLocationText = $(descriptionDataElements[0]).text();
        const descriptionPieces = [];
        let location;
        // Sometimes location is not listed, e.g. for "pop-up" events, and they use the first
        // paragraph element for the description instead
        if (expectedLocationText.toLowerCase().includes('location: ')) {
            location = expectedLocationText.replace('Location: ', '');
        }
        else {
            descriptionPieces.push(expectedLocationText.trim());
        }
        for (let i = 1; i < descriptionDataElements.length; i++) {
            descriptionPieces.push($(descriptionDataElements[i]).text().trim());
        }
        return { title, startTime, endTime, location, isAllDay, description: descriptionPieces.join('\n') };
    }
    static async retrieveCalendarEventListFromWeb() {
        let htmlResponse;
        try {
            htmlResponse = await retryingRequest_1.default(config_1.default.pages.UAB_CALENDAR);
        }
        catch (e) {
            throw e;
        }
        const $ = cheerio.load(htmlResponse);
        const eventEntryElements = $('.view-events-calendar .views-field-title a');
        const eventPromises = [];
        for (let i = 0; i < eventEntryElements.length; i++) {
            const url = $(eventEntryElements[i]).attr('href');
            eventPromises.push(UabModule.retrieveSingleCalendarEventFromWeb(url));
        }
        let eventList = [];
        try {
            eventList = await Promise.all(eventPromises);
        }
        catch (e) {
            throw e;
        }
        return eventList;
    }
    start() {
        const router = express.Router();
        router.get('/list', cache_1.handleEndpoint(cache_1.CacheKey.uabEvents, UabModule.retrieveCalendarEventListFromWeb));
        this.app.use('/uab', router);
    }
}
UabModule.IDENTIFIER = 'UAB Events';
exports.default = UabModule;
//# sourceMappingURL=index.js.map
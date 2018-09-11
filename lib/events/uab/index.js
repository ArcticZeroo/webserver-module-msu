const express = require('express');
const cheerio = require('cheerio');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../../config/');
const request = require('../../common/retryingRequest');

class UabModule extends WebserverModule {
    static async retrieveSingleCalendarEventFromWeb(url) {
        let htmlResponse;
        try {
            htmlResponse = await request(config.pages.UAB_EVENT_BASE + url);
        } catch (e) {
            throw e;
        }

        const $ = cheerio.load(htmlResponse);

        const title = $('#page-title').text();
        const startTime = new Date($('.date-display-start').attr('content')).getTime();
        const endTime = new Date($('.date-display-end').attr('content')).getTime();

        const descriptionDataElements = $('.field-name-body .field-item p');

        const location = $(descriptionDataElements[0]).find('strong').text().replace('Location: ', '');

        const descriptionPieces = [];

        for (let i = 1; i < descriptionDataElements.length; i++) {
            descriptionPieces.push($(descriptionDataElements[i]).text());
        }

        return { title, startTime, endTime, location, description: descriptionPieces.join('\n') };
    }

    static async retrieveCalendarEventListFromWeb() {
        let htmlResponse;
        try {
            htmlResponse = await request(config.pages.UAB_CALENDAR);
        } catch (e) {
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
        } catch (e) {
            throw e;
        }

        return eventList;
    }

    start() {
        const router = express.Router();

        router.get('/list', (req, res) => {
            UabModule.retrieveCalendarEventListFromWeb()
                .then(list => res.json(list))
                .catch(() => res.status(500).json({ error: 'Internal Server Error' }));
        });

        this.app.use('/uab', router);
    }
}

module.exports = UabModule;
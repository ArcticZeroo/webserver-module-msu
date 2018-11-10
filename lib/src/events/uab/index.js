const express = require('express');
const cheerio = require('cheerio');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../../../config/index');
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
        } else {
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
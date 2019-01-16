import { IWebserverModuleParams } from '@arcticzeroo/webserver-module/WebserverModule';
import IUabEvent from '../../../../interfaces/events/IUabEvent';
import { handleEndpoint, CacheKey } from '../../../cache';

import * as express from 'express';
import * as cheerio from 'cheerio';

import WebserverModule from '@arcticzeroo/webserver-module';
import * as config from '../../../../config';
import request from '../../../common/retryingRequest';

export default class UabModule extends WebserverModule {
    static IDENTIFIER = 'UAB Events';

    constructor(data: IWebserverModuleParams) {
        super({ ...data, name: UabModule.IDENTIFIER });
    }

    static async retrieveSingleCalendarEventFromWeb(url: string): Promise<IUabEvent> {
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
        const descriptionPieces: string[] = [];

        let location: string;

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

    static async retrieveCalendarEventListFromWeb(): Promise<IUabEvent[]> {
        let htmlResponse;
        try {
            htmlResponse = await request(config.pages.UAB_CALENDAR);
        } catch (e) {
            throw e;
        }

        const $ = cheerio.load(htmlResponse);

        const eventEntryElements = $('.view-events-calendar .views-field-title a');
        const eventPromises: Promise<IUabEvent>[] = [];

        for (let i = 0; i < eventEntryElements.length; i++) {
            const url = $(eventEntryElements[i]).attr('href');

            eventPromises.push(UabModule.retrieveSingleCalendarEventFromWeb(url));
        }

        let eventList: IUabEvent[] = [];
        try {
            eventList = await Promise.all(eventPromises);
        } catch (e) {
            throw e;
        }

        return eventList;
    }

    start() {
        const router = express.Router();

        router.get('/list', handleEndpoint(CacheKey.uabEvents, UabModule.retrieveCalendarEventListFromWeb));

        this.app.use('/uab', router);
    }
}
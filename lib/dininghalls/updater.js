const WebserverModule = require('@arcticzeroo/webserver-module');

const { Meal } = require('./enum');
const { MenuDate } = require('./api/food');

// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};

function loadDay(date) {

}

function loadAll() {
    for (let i = DAYS_TO_COLLECT.start; i < DAYS_TO_COLLECT.end; i++) {
        // Offset today by the day we're currently on to get the day we care about...
        // e.g. date + 1 would be tomorrow, you get the point.
        const date = new Date();
        date.setDate(date.getDate() + i);
    }
}

class UpdaterModule extends WebserverModule {
    start() {

    }
}
const { Meal } = require('./api');
const food = require('./data/food');

// Collect the last day, and the next week
const DAYS_TO_COLLECT = {
    start: -1,
    end: 7
};

function loadAll() {
    for (let i = DAYS_TO_COLLECT.start; i < DAYS_TO_COLLECT.end; i++) {
        const date = new Date();
        // Go to the correct day
        date.setDate(date.getDate() + i);
    }
}
const MongoUtil = require('../util/MongoUtil');
const db = require('../../../database');

const log = require('./logger');
const names = require('./data/names');
const hours = require('./data/hours');

let cache = null;

async function retrieveFromDb() {
    return new Promise((resolve, reject) => {
        db.MsuDiningHall.find({}, function (err, docs) {
            if (err) {
                return reject(err);
            }

            if (!docs) {
                return reject(new Error('Docs was null'));
            }

            resolve(docs);
        });
    });
}

async function retrieveFromWeb() {
    let diningHalls;
    try {
        diningHalls = await names.getDiningHallNames();
    } catch (e) {
        throw e;
    }

    let diningHallHours;
    try {
        diningHallHours = await hours.getDiningHallHours(diningHalls);
    } catch (e) {
        throw e;
    }

    const processedDiningHalls = [];

    for (const searchName of Object.keys(diningHallHours)) {
        for (let i = 0; i < diningHalls.length; i++) {
            const hall = diningHalls[i];

            if (hall.searchName === searchName) {
                // Set the hours property on this hall
                hall.hours = diningHallHours[searchName];
                // Add to processed ones
                processedDiningHalls.push(hall);
                // Remove it from the original list so we don't
                // have to iterate as far (on average)
                diningHalls.splice(i, 1);
                break;
            }
        }
    }

    return processedDiningHalls;
}

async function retrieveAndSaveFromWeb() {
    let diningHalls;
    try {
        diningHalls = await retrieveFromWeb();

        await MongoUtil.remove(db.MsuDiningHall);
    } catch (e) {
        throw e;
    }

    for (const diningHall of diningHalls) {
        const diningHallDoc = new db.MsuDiningHall(diningHall);

        try {
            await MongoUtil.save(diningHallDoc);
        } catch (e) {
            throw e;
        }
    }

    return diningHalls;
}

async function retrieve(respectCache = true) {
    log.debug('Retrieving halls...');

    if (cache && respectCache) {
        return cache;
    }

    log.debug('Getting from db...');
    let dbHalls;
    try {
        dbHalls = await retrieveFromDb();
    } catch (e) {
        log.error(e);
        throw e;
    }

    if (dbHalls.length) {
        log.debug('There are halls in the db, returning');
        return dbHalls.map(diningHall => MongoUtil.cleanProperties(db.schemas.MsuDiningHall, diningHall));
    }

    log.debug('Getting from web');
    return retrieveAndSaveFromWeb();
}

async function retrieveAndUpdateCache() {
    return retrieve(false).then(d => cache = d);
}

async function forceUpdate() {
    return retrieveAndSaveFromWeb().then(d => cache = d);
}

db.once('open', function () {
    retrieveAndUpdateCache().catch(console.error);
});

async function findBySearchName(search) {
    let diningHalls;
    try {
        diningHalls = await retrieve();
    } catch (e) {
        throw e;
    }

    const searchClean = search.toLowerCase().trim();

    for (const diningHall of diningHalls) {
        if (diningHall.searchName.trim() === searchClean) {
            return diningHall;
        }
    }

    return null;
}

module.exports = { forceUpdate, retrieve, retrieveFromDb, retrieveFromWeb, retrieveAndSaveFromWeb, retrieveAndUpdateCache, findBySearchName };
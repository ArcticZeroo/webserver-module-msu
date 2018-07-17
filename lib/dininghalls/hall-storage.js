const WebserverModule = require('@arcticzeroo/webserver-module');

const MongoUtil = require('../util/MongoUtil');

const names = require('./api/names');
const hours = require('./api/hours');

class HallStorageModule extends WebserverModule {
    start() {
        this.cache = null;

        this.db.once('open', () => {
            this.retrieveAndUpdateCache().catch(console.error);
        });
    }

    async retrieveFromDb() {
        return new Promise((resolve, reject) => {
            this.db.MsuDiningHall.find({}, function (err, docs) {
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

    async retrieveFromWeb() {
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

    async retrieveAndSaveFromWeb() {
        let diningHalls;
        try {
            diningHalls = await this.retrieveFromWeb();

            await this.db.MsuDiningHall.remove().exec();
        } catch (e) {
            throw e;
        }

        for (const diningHall of diningHalls) {
            const diningHallDoc = new this.db.MsuDiningHall(diningHall);

            try {
                await MongoUtil.save(diningHallDoc);
            } catch (e) {
                throw e;
            }
        }

        return diningHalls;
    }

    async retrieve(respectCache = true) {
        this.log.debug('Retrieving halls...');

        if (this.cache && respectCache) {
            return this.cache;
        }

        this.log.debug('Getting from this.db...');
        let dbHalls;
        try {
            dbHalls = await this.retrieveFromDb();
        } catch (e) {
            this.log.error(e);
            throw e;
        }

        if (dbHalls.length) {
            this.log.debug('There are halls in the db, returning');
            return dbHalls.map(diningHall => MongoUtil.cleanProperties(this.db.schemas.MsuDiningHall, diningHall));
        }

        this.log.debug('Getting from web');
        return this.retrieveAndSaveFromWeb();
    }

    async retrieveAndUpdateCache() {
        return this.retrieve(false).then(d => this.cache = d);
    }

    async forceUpdate() {
        return this.retrieveAndSaveFromWeb().then(d => this.cache = d);
    }

    async findBySearchName(search) {
        let diningHalls;
        try {
            diningHalls = await this.retrieve();
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
}

HallStorageModule.IDENTIFIER = 'hallStorageModule';

module.exports = HallStorageModule;
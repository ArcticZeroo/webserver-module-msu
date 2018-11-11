"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const halls_1 = require("./api/halls");
const MongoUtil_1 = require("../util/MongoUtil");
const WebserverModule_1 = require("@arcticzeroo/webserver-module/WebserverModule");
const hours_1 = require("./api/hours");
class HallStorageModule extends WebserverModule_1.default {
    constructor(data) {
        super({ ...data, name: HallStorageModule.IDENTIFIER });
    }
    start() {
        this.cache = null;
        this.db.once('open', () => {
            this.retrieveAndUpdateCache().catch(console.error);
        });
    }
    async retrieveFromDb() {
        return new Promise((resolve, reject) => {
            // @ts-ignore
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
            diningHalls = await halls_1.retrieveDiningHalls();
        }
        catch (e) {
            throw e;
        }
        let diningHallHours;
        try {
            diningHallHours = await hours_1.retrieveDiningHallHours(diningHalls);
        }
        catch (e) {
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
            // @ts-ignore
            await this.db.MsuDiningHall.remove().exec();
        }
        catch (e) {
            throw e;
        }
        for (const diningHall of diningHalls) {
            // @ts-ignore
            const diningHallDoc = new this.db.MsuDiningHall(diningHall);
            try {
                await MongoUtil_1.default.save(diningHallDoc);
            }
            catch (e) {
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
        if (!DEVELOPMENT) {
            this.log.debug('Getting from this.db...');
            let dbHalls;
            try {
                dbHalls = await this.retrieveFromDb();
            }
            catch (e) {
                this.log.error(e);
                throw e;
            }
            if (dbHalls.length) {
                this.log.debug('There are halls in the db, returning');
                // @ts-ignore
                return dbHalls.map(diningHall => MongoUtil_1.default.cleanProperties(this.db.schemas.MsuDiningHall, diningHall));
            }
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
        }
        catch (e) {
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
exports.default = HallStorageModule;
//# sourceMappingURL=hall-storage.js.map
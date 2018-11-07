"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const halls_1 = require("./api/halls");
const MongoUtil_1 = require("../util/MongoUtil");
const WebserverModule_1 = require("@arcticzeroo/webserver-module/WebserverModule");
const hours_1 = require("./api/hours");
class HallStorageModule extends WebserverModule_1.default {
    constructor(data) {
        super(Object.assign({}, data, { name: HallStorageModule.IDENTIFIER }));
    }
    start() {
        this.cache = null;
        this.db.once('open', () => {
            this.retrieveAndUpdateCache().catch(console.error);
        });
    }
    retrieveFromDb() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    retrieveFromWeb() {
        return __awaiter(this, void 0, void 0, function* () {
            let diningHalls;
            try {
                diningHalls = yield halls_1.retrieveDiningHalls();
            }
            catch (e) {
                throw e;
            }
            let diningHallHours;
            try {
                diningHallHours = yield hours_1.retrieveDiningHallHours(diningHalls);
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
        });
    }
    retrieveAndSaveFromWeb() {
        return __awaiter(this, void 0, void 0, function* () {
            let diningHalls;
            try {
                diningHalls = yield this.retrieveFromWeb();
                yield this.db.MsuDiningHall.remove().exec();
            }
            catch (e) {
                throw e;
            }
            for (const diningHall of diningHalls) {
                const diningHallDoc = new this.db.MsuDiningHall(diningHall);
                try {
                    yield MongoUtil_1.default.save(diningHallDoc);
                }
                catch (e) {
                    throw e;
                }
            }
            return diningHalls;
        });
    }
    retrieve(respectCache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Retrieving halls...');
            if (this.cache && respectCache) {
                return this.cache;
            }
            this.log.debug('Getting from this.db...');
            let dbHalls;
            try {
                dbHalls = yield this.retrieveFromDb();
            }
            catch (e) {
                this.log.error(e);
                throw e;
            }
            if (dbHalls.length) {
                this.log.debug('There are halls in the db, returning');
                return dbHalls.map(diningHall => MongoUtil_1.default.cleanProperties(this.db.schemas.MsuDiningHall, diningHall));
            }
            this.log.debug('Getting from web');
            return this.retrieveAndSaveFromWeb();
        });
    }
    retrieveAndUpdateCache() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.retrieve(false).then(d => this.cache = d);
        });
    }
    forceUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.retrieveAndSaveFromWeb().then(d => this.cache = d);
        });
    }
    findBySearchName(search) {
        return __awaiter(this, void 0, void 0, function* () {
            let diningHalls;
            try {
                diningHalls = yield this.retrieve();
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
        });
    }
}
HallStorageModule.IDENTIFIER = 'hallStorageModule';
exports.default = HallStorageModule;
//# sourceMappingURL=hall-storage.js.map
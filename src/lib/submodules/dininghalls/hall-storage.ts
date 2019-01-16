import Environment from '../../../global/Environment';
import IDiningHallHours from '../../../interfaces/dining-halls/IDiningHallHours';
import IDiningHallWithHours from '../../../interfaces/dining-halls/IDiningHallWithHours';
import RequireHallStorageModule from '../../../interfaces/RequireHallStorageModule';
import { IDiningHallDocument } from '../../../models/dining-halls/hall/DiningHall';
import { retrieveDiningHalls } from './api/halls';
import MongoUtil from '../../util/MongoUtil';
import WebserverModule, {IWebserverModuleParams} from '@arcticzeroo/webserver-module';
import { retrieveDiningHallHours } from './api/hours';
import { Connection, Model } from 'mongoose';

export default class HallStorageModule extends WebserverModule<RequireHallStorageModule> {
    public db: Connection & { MsuDiningHall: Model<IDiningHallDocument> };
    private cache: IDiningHallWithHours[];
    private _initialized: boolean = false;
    private _initializeHandlers: Array<() => void> = [];

    constructor(data: IWebserverModuleParams & RequireHallStorageModule) {
        super({ ...data, name: HallStorageModule.IDENTIFIER });
    }

    start() {
        this.log.info('Starting hall storage module');
        this.cache = null;

        this.db.once('open', () => {
            this.log.debug('Pulling dining halls from db...');
            this.retrieveAndUpdateCache()
                .then(() => {
                    this._initialized = true;

                    for (const handler of this._initializeHandlers) {
                        handler();
                    }

                    // Remove all array elements in-place
                    this._initializeHandlers.splice(0);
                })
                .catch(console.error);
        });
    }

    onReady(callback: () => any): void {
        if (this._initialized) {
            callback();
            return;
        }

        this._initializeHandlers.push(callback);
    }

    async retrieveFromDb(): Promise<IDiningHallWithHours[]> {
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

    async retrieveFromWeb(): Promise<IDiningHallWithHours[]> {
        let diningHalls;
        try {
            diningHalls = await retrieveDiningHalls();
        } catch (e) {
            throw e;
        }

        let diningHallHours: { [key: string]: IDiningHallHours };
        try {
            diningHallHours = await retrieveDiningHallHours(diningHalls);
        } catch (e) {
            throw e;
        }

        const processedDiningHalls: IDiningHallWithHours[] = [];

        for (const searchName of Object.keys(diningHallHours)) {
            for (let i = 0; i < diningHalls.length; i++) {
                const hall = diningHalls[i];

                if (hall.searchName === searchName) {
                    // Set the hours property on this hall
                    const hallWithHours = Object.assign({}, hall, { hours: diningHallHours[searchName] });
                    // Add to processed ones
                    processedDiningHalls.push(hallWithHours);
                    // Remove it from the original list so we don't
                    // have to iterate as far (on average)
                    diningHalls.splice(i, 1);
                    break;
                }
            }
        }

        return processedDiningHalls;
    }

    async retrieveAndSaveFromWeb(): Promise<IDiningHallWithHours[]> {
        let diningHalls;
        try {
            diningHalls = await this.retrieveFromWeb();

            // @ts-ignore
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

        this.cache = diningHalls;

        return diningHalls;
    }

    async retrieve(respectCache = true): Promise<IDiningHallWithHours[]> {
        this.log.debug('Retrieving halls...');

        if (this.cache && respectCache) {
            this.log.debug('Have it cached!');
            return this.cache;
        }

        if (!Environment.isDevelopment) {
            this.log.debug('Getting from this.db...');
            let dbHalls: IDiningHallWithHours[];
            try {
                dbHalls = await this.retrieveFromDb();
            } catch (e) {
                this.log.error(e);
                throw e;
            }

            if (dbHalls.length) {
                this.log.debug('There are halls in the db, returning');
                // @ts-ignore
                return dbHalls.map(diningHall => MongoUtil.cleanProperties(this.db.schemas.MsuDiningHall, diningHall));
            }
        }

        this.log.debug('Getting from web');
        return this.retrieveAndSaveFromWeb();
    }

    async retrieveAndUpdateCache(): Promise<any> {
        return this.retrieve(false).then(d => this.cache = d);
    }

    async forceUpdate(): Promise<any> {
        return this.retrieveAndSaveFromWeb().then(d => this.cache = d);
    }

    async findBySearchName(search: string): Promise<IDiningHallWithHours> {
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

    static IDENTIFIER: string = 'hallStorageModule';
}
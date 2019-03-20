import { IWebserverModuleParams } from '@arcticzeroo/webserver-module/WebserverModule';
import ExpiringCache from 'expiring-cache';
import WebserverModule from '@arcticzeroo/webserver-module';
import IDiningHallBase from '../../../../interfaces/dining-halls/IDiningHallBase';
import IDiningHallMenu from '../../../../interfaces/dining-halls/menu/IDiningHallMenu';
import RequireHallStorageModule from '../../../../interfaces/RequireHallStorageModule';
import { Meal } from '../enum';
import HallStorageModule from '../hall-storage';
import Duration from '@arcticzeroo/duration';
import retrieveMenusForDayFromWeb from './menu';
import IMenuDaySelection from '../../../../interfaces/dining-halls/menu/IMenuDaySelection';
import MenuDate from './MenuDate';

class FoodModule extends WebserverModule<RequireHallStorageModule> {
    /**
     * Using a local cache instead of an expiring-per-item-cache because ExpiringCache allows for values to be retrieved
     * with dynamic keys but static fetch methods, vs the per item cache which requires a key to be registered
     * beforehand since each key has its own fetch method
     */
    private cache: ExpiringCache<string, IDiningHallMenu[]>;
    private storage: HallStorageModule;

    constructor(data: IWebserverModuleParams & RequireHallStorageModule) {
        super({...data, name: FoodModule.IDENTIFIER, startByDefault: false});

        this.storage = data.storage;

        this.cache = new ExpiringCache(
            async key => retrieveMenusForDayFromWeb(await this.deserializeFromKey(key)),
            new Duration({hours: 12})
        );
    }

    static serializeToKey({diningHall, menuDate}: IMenuDaySelection): string {
        return [diningHall.searchName, menuDate.getFormatted()].join('|');
    }

    async deserializeFromKey(key: string): Promise<IMenuDaySelection> {
        const [searchName, date] = key.split('|');

        let diningHall;
        try {
            diningHall = await this.storage.findBySearchName(searchName);
        } catch (e) {
            throw e;
        }

        return {diningHall, menuDate: MenuDate.fromFormatted(date)};
    }

    retrieveDayMenus(diningHall: IDiningHallBase, menuDate: MenuDate): Promise<IDiningHallMenu[]> {
        return this.cache.getEntry(FoodModule.serializeToKey({diningHall, menuDate}));
    }

    async retrieveSingleMenu(diningHall: IDiningHallBase, menuDate: MenuDate, meal: Meal): Promise<IDiningHallMenu> {
        const dayMenus = await this.retrieveDayMenus(diningHall, menuDate);

        return dayMenus[meal.valueOf()];
    }

    cacheDayMenus(menuSelection: IMenuDaySelection, menus: IDiningHallMenu[]) {
        this.cache.set(FoodModule.serializeToKey(menuSelection), menus);
    }

    static IDENTIFIER: string = 'foodModule';

    start(): void {

    }
}

export { FoodModule, MenuDate }
import WebserverModule, { IWebserverModuleParams } from '@arcticzeroo/webserver-module';

import DiningHallModule from './lib/submodules/dininghalls';
import EventsModule from './lib/submodules/events';
import FoodTruckModule from './lib/submodules/foodtruck';
import MovieModule from './lib/submodules/movies';

class MsuRootModule extends WebserverModule {
    static IDENTIFIER: string = 'MSU Root Module';

    constructor(data: IWebserverModuleParams) {
        super({ ...data, name: MsuRootModule.IDENTIFIER });
    }

    start() {
        this.log.info('Starting MSU module');

        for (const child of [
            DiningHallModule,
            FoodTruckModule,
            MovieModule,
            EventsModule
        ]) {
            this.loadChild(child);
        }
    }
}

export default MsuRootModule;
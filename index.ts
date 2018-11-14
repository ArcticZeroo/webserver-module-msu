import WebserverModule from '@arcticzeroo/webserver-module';

import DiningHallModule from './lib/src/submodules/dininghalls';
import EventsModule from './lib/src/submodules/events';
import FoodTruckModule from './lib/src/submodules/foodtruck';
import MovieModule from './lib/src/submodules/movies';


class MsuRootModule extends WebserverModule {
    static IDENTIFIER: string = 'MSU Root Module';

    constructor(data: any) {
        super({ ...data, name: MsuRootModule.IDENTIFIER });
    }

    start() {
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
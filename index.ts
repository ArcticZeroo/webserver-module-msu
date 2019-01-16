import WebserverModule from '@arcticzeroo/webserver-module';

import DiningHallModule from './src/lib/submodules/dininghalls';
import EventsModule from './src/lib/submodules/events';
import FoodTruckModule from './src/lib/submodules/foodtruck';
import MovieModule from './src/lib/submodules/movies';


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
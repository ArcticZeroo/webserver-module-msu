import WebserverModule from '@arcticzeroo/webserver-module';

import DiningHallModule from './lib/src/dininghalls';
import EventsModule from './lib/src/events';
import FoodTruckModule from './lib/src/foodtruck';
import MovieModule from './lib/src/movies';


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

export = MsuRootModule;
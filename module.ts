import WebserverModule from '@arcticzeroo/webserver-module';

export default class MsuRootModule extends WebserverModule {
    start() {
        for (const child of [
            require('./lib/src/dininghalls'),
            require('./lib/src/foodtruck'),
            require('./lib/src/movies'),
            require('./lib/src/events')
        ]) {
            this.loadChild(child);
        }
    }
}
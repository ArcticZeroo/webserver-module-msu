import WebserverModule from '@arcticzeroo/webserver-module';

export default class MsuRootModule extends WebserverModule {
    start() {
        for (const child of [
            require('./lib/dininghalls'),
            require('./lib/foodtruck/index'),
            require('./lib/movies/index'),
            require('./lib/events')
        ]) {
            this.loadChild(child);
        }
    }
}
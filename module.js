const WebserverModule = require('@arcticzeroo/webserver-module');

class MsuRootModule extends WebserverModule {
    start() {
        for (const child of [
            require('./lib/dininghalls'),
            require('./lib/foodtruck'),
            require('./lib/movies'),
            require('./lib/events')
        ]) {
            this.loadChild(child);
        }
    }
}

module.exports = MsuRootModule;
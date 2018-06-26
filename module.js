const WebserverModule = require('@arcticzeroo/webserver-module');

class MsuRootModule extends WebserverModule {
   start() {
      for (const child of [
         require('./lib/dininghalls'),
         require('./lib/foodtruck'),
         require('./lib/movies')
      ]) {
         this.loadChild(child);
      }
   }
}

module.exports = MsuRootModule;
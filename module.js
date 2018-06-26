const WebserverModule = require('@arcticzeroo/webserver-module');

class MsuRootModule extends WebserverModule {
   start() {
      [
         
      ].forEach(this.loadChild.bind(this))
   }
}

module.exports = MsuRootModule;
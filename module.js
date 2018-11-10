"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
class MsuRootModule extends webserver_module_1.default {
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
exports.default = MsuRootModule;
//# sourceMappingURL=module.js.map
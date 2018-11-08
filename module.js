"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
class MsuRootModule extends webserver_module_1.default {
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
exports.default = MsuRootModule;
//# sourceMappingURL=module.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
class MsuRootModule extends webserver_module_1.default {
    constructor(data) {
        super(Object.assign({}, data, { name: MsuRootModule.IDENTIFIER }));
    }
    start() {
        for (const child of [
            require('./lib/src/dininghalls'),
            require('./lib/src/foodtruck'),
            require('./lib/src/movies'),
            require('./lib/src/events/index')
        ]) {
            this.loadChild(child);
        }
    }
}
MsuRootModule.IDENTIFIER = 'MSU Root Module';
exports.default = MsuRootModule;
//# sourceMappingURL=module.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const dininghalls_1 = require("./lib/src/dininghalls");
const events_1 = require("./lib/src/events");
const foodtruck_1 = require("./lib/src/foodtruck");
const movies_1 = require("./lib/src/movies");
class MsuRootModule extends webserver_module_1.default {
    constructor(data) {
        super(Object.assign({}, data, { name: MsuRootModule.IDENTIFIER }));
    }
    start() {
        for (const child of [
            dininghalls_1.default,
            foodtruck_1.default,
            movies_1.default,
            events_1.default
        ]) {
            this.loadChild(child);
        }
    }
}
MsuRootModule.IDENTIFIER = 'MSU Root Module';
exports.default = MsuRootModule;
//# sourceMappingURL=module.js.map
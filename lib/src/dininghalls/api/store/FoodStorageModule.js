"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const mongoose_1 = require("mongoose");
class FoodStorageModule extends webserver_module_1.default {
    start() {
    }
}
FoodStorageModule._foodSchema = new mongoose_1.Schema({
    diningHall: String,
    date: Date,
    meal: Number,
});
//# sourceMappingURL=FoodStorageModule.js.map
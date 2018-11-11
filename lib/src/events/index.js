"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const express = require("express");
const uab_1 = require("./uab");
class EventsModule extends webserver_module_1.default {
    constructor(data) {
        //TODO: Add this behavior to webserver module package itself
        // Child classes will now only have to route to their desired path, not /api/msu/events, when they use app
        const router = express.Router();
        data.app.use('/api/msu/events', router);
        data.app = router;
        super(data);
        this.loadChild(uab_1.default);
    }
    start() {
    }
}
exports.default = EventsModule;
//# sourceMappingURL=index.js.map
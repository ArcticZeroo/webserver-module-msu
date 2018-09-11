const WebserverModule = require('@arcticzeroo/webserver-module');
const express = require('express');

class EventsModule extends WebserverModule {
    constructor(data) {
        //TODO: Add this behavior to webserver module package itself
        // Child classes will now only have to route to their desired path, not /api/msu/events, when they use app
        const router = express.Router();
        data.app.use('/api/msu/events', router);
        data.app = router;

        super(data);

        this.loadChild(require('./uab'));
    }
}

module.exports = EventsModule;
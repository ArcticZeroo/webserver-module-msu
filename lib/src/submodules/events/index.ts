import WebserverModule from '@arcticzeroo/webserver-module';
import * as express from 'express';
import UabModule from './uab/index';

export default class EventsModule extends WebserverModule {
    constructor(data) {
        //TODO: Add this behavior to webserver module package itself
        // Child classes will now only have to route to their desired path, not /api/msu/events, when they use app
        const router = express.Router();
        data.app.use('/api/msu/events', router);
        data.app = router;

        super(data);

        this.loadChild(UabModule);
    }

    start(): void {

    }
}

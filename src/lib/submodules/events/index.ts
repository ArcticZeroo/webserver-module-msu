import WebserverModule from '@arcticzeroo/webserver-module';
import { IWebserverModuleParams } from '@arcticzeroo/webserver-module/WebserverModule';
import * as express from 'express';
import UabModule from './uab';

export default class EventsModule extends WebserverModule {
    constructor(data: IWebserverModuleParams) {
        //TODO: Add this behavior to webserver module package itself
        // Child classes will now only have to route to their desired path, not /api/msu/events, when they use app
        const router = express.Router();
        data.app.use('/api/msu/events', router);
        data.app = router;

        super(data);
    }

    start(): void {
        this.loadChild(UabModule);
    }
}
import WebserverModule from '@arcticzeroo/webserver-module';

export default class MsuRootModule extends WebserverModule {
    static IDENTIFIER: string = 'MSU Root Module';

    constructor(data: any) {
        super({ ...data, name: MsuRootModule.IDENTIFIER });
    }

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
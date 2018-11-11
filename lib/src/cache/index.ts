import ExpiringCache from 'expiring-per-item-cache';
import { RequestHandler } from 'express';
import WebserverModule from '@arcticzeroo/webserver-module';

enum CacheKey {
    foodTruckMenu,
    foodTruckHtml,
    foodTruckStops,
    foodTruckLegacy,
    movieNightShowings,
    movieNightLegacy,
    uabEvents,
    diningHallList
}

const cache = new ExpiringCache<CacheKey, any>();

const handleEndpoint = (key: CacheKey, fetch: () => Promise<any>, module?: WebserverModule): RequestHandler => {
    cache.add(key, { fetch });

    // Return the request handler that will be used
    return (req, res) => {
        cache.getValue(key)
            .then((value => res.status(200).json(value)))
            // .catch(console.error)
            .catch(e => {
                res.status(500).json({ error: 'Internal Server Error' });

                if (module) {
                    module.log.error(`Error in endpoint ${req.route.path}`);
                }
            });
    };
};

export { CacheKey, cache, handleEndpoint };
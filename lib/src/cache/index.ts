import ExpiringCache from 'expiring-per-item-cache';
import { RequestHandler } from 'express';

enum CacheKey {
    foodTruckMenu,
    foodTruckHtml,
    foodTruckStops,
    foodTruckLegacy,
    movieNightShowings,
    movieNightLegacy,
    uabEvents
}

const cache = new ExpiringCache<CacheKey, any>();

const handleEndpoint = (key: CacheKey, fetch: () => Promise<any>): RequestHandler => {
    cache.add(key, { fetch });

    // Return the request handler that will be used
    return (req, res) => {
        cache.getValue(key)
            .then((value => res.status(200).json(value)))
            // .catch(console.error)
            .catch(() => res.status(500).json({ error: 'Internal Server Error' }));
    };
};

export { CacheKey, cache, handleEndpoint };
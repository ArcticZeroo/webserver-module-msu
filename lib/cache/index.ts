import * as ExpiringCache from 'expiring-per-item-cache';

const cache = new ExpiringCache();

cache.handleEndpoint = (key, fetch) => {
    cache.add(key, { fetch });

    return (req, res) => {
        cache.getValue(key)
            .then((value => res.status(200).json(value)))
            // .catch(console.error)
            .catch(() => res.status(500).json({ error: 'Internal Server Error' }));
    };
};

const keys = {
    foodTruckMenu: 'foodTruck_menu',
    foodTruckHtml: 'foodTruck_html'
};

cache.keys = keys;

export default cache;
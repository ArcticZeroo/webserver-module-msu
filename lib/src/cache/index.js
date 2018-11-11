"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expiring_per_item_cache_1 = require("expiring-per-item-cache");
var CacheKey;
(function (CacheKey) {
    CacheKey[CacheKey["foodTruckMenu"] = 0] = "foodTruckMenu";
    CacheKey[CacheKey["foodTruckHtml"] = 1] = "foodTruckHtml";
    CacheKey[CacheKey["foodTruckStops"] = 2] = "foodTruckStops";
    CacheKey[CacheKey["foodTruckLegacy"] = 3] = "foodTruckLegacy";
    CacheKey[CacheKey["movieNightShowings"] = 4] = "movieNightShowings";
    CacheKey[CacheKey["movieNightLegacy"] = 5] = "movieNightLegacy";
    CacheKey[CacheKey["uabEvents"] = 6] = "uabEvents";
    CacheKey[CacheKey["diningHallList"] = 7] = "diningHallList";
})(CacheKey || (CacheKey = {}));
exports.CacheKey = CacheKey;
const cache = new expiring_per_item_cache_1.default();
exports.cache = cache;
const handleEndpoint = (key, fetch, module) => {
    cache.add(key, { fetch });
    // Return the request handler that will be used
    return (req, res) => {
        cache.getValue(key)
            .then((value => res.status(200).json(value)))
            // .catch(console.error)
            .catch(e => {
            res.status(500).json({ error: 'Internal Server Error' });
            if (module) {
                module.log.error(`Error in endpoint ${req.route.path}:`);
                module.log.error(e);
            }
        });
    };
};
exports.handleEndpoint = handleEndpoint;
//# sourceMappingURL=index.js.map
const request = require('./request');

async function makeRetryingRequest(uri, limit = 2) {
    try {
        return await request(uri);
    } catch (e) {
        if (limit > 1) {
            return makeRetryingRequest(uri, --limit);
        }

        throw e;
    }
}

module.exports = makeRetryingRequest;
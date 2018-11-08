"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./request");
async function makeRetryingRequest(uri, limit = 2) {
    try {
        return await request_1.default(uri);
    }
    catch (e) {
        if (limit > 1) {
            return makeRetryingRequest(uri, --limit);
        }
        throw e;
    }
}
exports.default = makeRetryingRequest;
//# sourceMappingURL=retryingRequest.js.map
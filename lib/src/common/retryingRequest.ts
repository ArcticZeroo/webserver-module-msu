import request from './request';

async function makeRetryingRequest(uri: string, limit: number = 2): Promise<string> {
    try {
        return await request(uri);
    } catch (e) {
        if (limit > 1) {
            return makeRetryingRequest(uri, --limit);
        }

        throw e;
    }
}

export default makeRetryingRequest;
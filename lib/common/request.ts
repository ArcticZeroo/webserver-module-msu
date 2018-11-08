import * as request from 'request';

async function makeMsuRequest(uri: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        request.get({ uri, rejectUnauthorized: false },
            (err, res, body) => {
                if (err) {
                    if (res && res.statusCode.toString()[0] !== '2') {
                        reject(`(${res.statusCode}) ${err}`);
                    } else {
                        reject(err);
                    }
                    return;
                }

                if (!res) {
                    reject('Response is empty.');
                    return;
                }

                if (res.statusCode.toString()[0] !== '2') {
                    reject(res.statusCode);
                    return;
                }

                if (!body || body == null) {
                    reject('Body is empty.');
                    return;
                }

                resolve(body);
            });
    });
}

export default makeMsuRequest;
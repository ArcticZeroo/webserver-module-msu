const request = require('request');

async function makeMsuRequest(uri) {
    return new Promise((resolve, reject) => {
        request({ uri, rejectUnauthorized: false },
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

module.exports = makeMsuRequest;
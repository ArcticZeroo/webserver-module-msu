"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
function makeMsuRequest(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            request.get({ uri, rejectUnauthorized: false }, (err, res, body) => {
                if (err) {
                    if (res && res.statusCode.toString()[0] !== '2') {
                        reject(`(${res.statusCode}) ${err}`);
                    }
                    else {
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
    });
}
exports.default = makeMsuRequest;
//# sourceMappingURL=request.js.map
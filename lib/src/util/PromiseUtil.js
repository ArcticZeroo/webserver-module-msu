"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PromiseUtil {
    static pause(time) {
        return new Promise(resolve => setTimeout(resolve, time.inMilliseconds));
    }
}
exports.default = PromiseUtil;
//# sourceMappingURL=PromiseUtil.js.map
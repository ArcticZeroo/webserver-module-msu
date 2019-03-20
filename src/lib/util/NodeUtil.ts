import Duration from '@arcticzeroo/duration';

export default class NodeUtil {
    static setIntervalImmediate(callback: () => any, ms: Duration | number) {
        if (ms instanceof Duration) {
            ms = ms.inMilliseconds;
        }

        callback();
        setInterval(callback, ms);
    }
}
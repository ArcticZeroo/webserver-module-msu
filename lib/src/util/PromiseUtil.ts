import Duration from '@arcticzeroo/duration';

export default class PromiseUtil {
    static pause(time: Duration): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, time.inMilliseconds));
    }
}
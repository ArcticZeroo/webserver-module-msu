export default abstract class Environment {
    static get isDevelopment(): boolean {
        return process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase().startsWith('dev');
    }
}
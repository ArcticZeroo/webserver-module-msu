import { Document, Model } from 'mongoose';

export default class MongoUtil {
    static save(doc: Document): Promise<void> {
        return new Promise((resolve, reject) => {
            doc.save(err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    static remove(model: Model<any>, query: {} = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            model.remove(query, err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    static markAndSave(doc: Document, ...props: string[]): Promise<void> {
        for (const prop of props) {
            doc.markModified(prop);
        }

        return MongoUtil.save(doc);
    }

    static cleanProperties(schema: {}, source: {}): {} {
        const copy = {};

        for (const prop of Object.keys(schema)) {
            copy[prop] = source[prop];
        }

        return copy;
    }
}
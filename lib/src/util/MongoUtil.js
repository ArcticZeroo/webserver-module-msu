class MongoUtil {
    static save(doc) {
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

    static remove(model, query = {}) {
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

    static markAndSave(doc, ...props) {
        for (const prop of props) {
            doc.markModified(prop);
        }

        return MongoUtil.save(doc);
    }

    static cleanProperties(schema, obj) {
        const copy = {};

        for (const prop of Object.keys(schema)) {
            copy[prop] = obj[prop];
        }

        return copy;
    }
}

module.exports = MongoUtil;
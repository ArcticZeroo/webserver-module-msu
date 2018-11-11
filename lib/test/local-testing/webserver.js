"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("../../../module");
const express = require("express");
const app = express();
new module_1.default({
    db: null,
    app,
    name: 'Test Module'
});
app.use((req, res) => res.status(404).send('404 Not Found'));
app.listen(3000, () => console.log('Listening on port 3000'));
//# sourceMappingURL=webserver.js.map
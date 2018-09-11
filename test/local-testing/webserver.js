const express = require('express');

const app = express();

const RootModule = require('../../module');

new RootModule({
    db: null,
    app,
    name: 'Test Module'
});

app.use((req, res) => res.status(404).send('404 Not Found'));

app.listen(3000, () => console.log('Listening on port 3000'));
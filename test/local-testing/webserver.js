const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const RootModule = require('../../module');

new RootModule({
    db: null,
    app,
    name: 'Test Module'
});

app.use((req, res) => res.status(404).send('404 Not Found'));

app.listen(4000, () => console.log('Listening on port 4000'));
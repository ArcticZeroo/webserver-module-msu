import express, { Request, Response } from 'express';
import RootModule from '../../index';
const app = express();

new RootModule({
    db: null,
    app,
    name: 'Test Module'
});

app.use((req: Request, res: Response) => res.status(404).send('404 Not Found'));

app.listen(3000, () => console.log('Listening on port 3000'));
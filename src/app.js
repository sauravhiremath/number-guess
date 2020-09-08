import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import routes from './routes';
import cors from 'cors';

import { colyseus as colyseusInit } from './socket/init';
import { handleError, logger } from './middlewares';
import { API_PORT, hosts } from './env';

const app = express();
const server = new http.Server(app);
colyseusInit(server);

app.use(cors({ origin: hosts, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app);

app.use((err, _req, res, _) => {
    handleError(err, res);
});

app.listen(API_PORT, () => {
    logger.info(`HTTP Api listening on port ${Number(API_PORT)}!`);
});

server.listen(Number(API_PORT) + 1, () => {
    logger.info(`Colyseus Server listening on port ${Number(API_PORT) + 1}!`);
    logger.info(`HTTP Api and Colyseus whitelisted for ${hosts}`);
});

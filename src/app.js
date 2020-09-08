import express from 'express';
import http from 'http';
import { Server, LobbyRoom } from 'colyseus';
import bodyParser from 'body-parser';
import cors from 'cors';

import routes from './routes';
import { RandomGuessRoom as RandomGuessHandler } from './controller';
import { handleError, logger } from './middlewares';
import { API_PORT, HOSTS } from './env';

const app = express();
const gameServer = new Server({
    server: new http.Server(app),
    express: app
});

gameServer.define('random-guess-lobby', LobbyRoom);
gameServer.define('random-guess', RandomGuessHandler).enableRealtimeListing();

app.use(cors({ origin: HOSTS, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app);

app.use((err, _req, res, _) => {
    handleError(err, res);
});

gameServer.listen(Number(API_PORT));
logger.info(`Server listening on port ${Number(API_PORT)}!`);
logger.info(`Whitelisted endpoints: <${HOSTS}>`);

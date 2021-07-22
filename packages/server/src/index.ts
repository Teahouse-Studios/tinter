import Koa from 'koa';
import http from 'http';
import cors from '@koa/cors';
import Game from './game';

const app = new Koa();
app.use(cors({ credentials: true }));

export const server = http.createServer(app.callback());
server.listen(45000);

global.game = new Game(server);

import Game from './game';

const Koa = require('koa');
const http = require('http');
const cors = require('@koa/cors');

const app = new Koa();
app.use(cors({
  credentials: true,
}));

export const server = http.createServer(app.callback());
server.listen(45000);

const game = new Game();

const Koa = require('koa')
const http = require('http')
const sockjs = require('sockjs');

const app = new Koa()

const echo = sockjs.createServer({prefix: '/echo'});
echo.on('connection', function (conn) {
  conn.on('data', function (message) {
    conn.write(message);
  });
  conn.on('close', function () {
  });
});

const server = http.createServer(app.callback());
echo.installHandlers(server, {prefix: '/echo'})
server.listen(45000)

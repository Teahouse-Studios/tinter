const Game = require('./dist/game');
global.game = new Game(global.Hydro.service.server.server);

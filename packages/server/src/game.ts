import sockjs from 'sockjs';
import { IPlayer, WsData } from './types';
import { server } from './index';

export enum GAME_STATE {
  WAITING, GAMING, FINISHED,
}

export default class Game {
  players: IPlayer[] = [];
  connections: Record<string, sockjs.Connection> = {};
  state: GAME_STATE = GAME_STATE.WAITING;
  echo = sockjs.createServer({ prefix: '/room' });

  public constructor() {
    this.echo.on('connection', this.onConnection.bind(this));
    this.echo.installHandlers(server, { prefix: '/room' });
  }

  private onConnection(conn: sockjs.Connection) {
    const p: IPlayer = {
      id: conn.id,
      owner: this.players.length === 0,
    };
    conn.send = (data) => { conn.write(JSON.stringify(data)); };
    this.connections[conn.id] = conn;
    this.players = [...this.players, p];
    console.log(this.players);

    conn.on('data', (msg) => {
      const data = JSON.parse(msg) as WsData;
      if (data.type === 'fetch_players') {
        return conn.send({
          type: 'players',
          data: this.players,
        });
      }
      if (data.subtype === 'chat') {
        for (const player of this.players) {
          this.connections[player.id].send({
            type: 'message',
            subtype: 'chat',
            data: {
              sender: p,
              message: data.data,
            },
          });
        }
      }
    });

    conn.on('close', () => {
      this.players = this.players.filter((v) => v.id !== conn.id);
      delete this.connections[conn.id];
    });
  }
}

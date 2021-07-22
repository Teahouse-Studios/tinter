import sockjs from 'sockjs';
import { IPlayer, ClientWsData, ServerWsData } from './types';
import Words from './words';

type STATE_WAITING = 0;
const STATE_WAITING = 0;
type GAME_STATE = STATE_WAITING | string;

export default class Game {
  players: IPlayer[] = [];
  connections: Record<string, sockjs.Connection> = {};
  state: GAME_STATE = STATE_WAITING;
  sockjs = sockjs.createServer({ prefix: '/room' });
  currentAnswer: string = '';
  success: Record<string, boolean> = {};

  public constructor(public server) {
    this.sockjs.on('connection', this.onConnection.bind(this));
    this.sockjs.installHandlers(server, { prefix: '/room' });
  }

  public boardcast(msg: ServerWsData) {
    for (const player of this.players) {
      this.connections[player.id].send(msg);
    }
  }

  public getPlayer(name: string) {
    return this.players.filter((i) => i.id === name)[0];
  }

  public startGame() {
    if (this.players.length < 2) return false;
    this.currentAnswer = Words[Math.floor(Math.random() * Words.length)];
    this.state = this.players[0].id;
    this.players.push(this.players.shift());
    this.boardcast({ type: 'start', subtype: 'guess', data: this.state });
    this.connections[this.state].send({ type: 'start', subtype: 'draw', data: this.currentAnswer });
    this.success = {};
    setTimeout(() => {
      this.startGame();
    }, 60000);
    return true;
  }

  private onConnection(conn: sockjs.Connection) {
    const p: IPlayer = {
      id: conn.id,
      score: 0,
      owner: !this.players.length,
    };
    conn.send = (data) => conn.write(JSON.stringify(data));
    conn.info = (message: string, sender?: string) => conn.send({
      type: 'message',
      subtype: 'info',
      data: message,
      sender,
    });
    this.connections[conn.id] = conn;
    this.players.push(p);
    console.log(this.players);

    this.boardcast({
      type: 'player',
      subtype: 'add',
      data: conn.id,
    });
    conn.send({
      type: 'players',
      data: this.players,
    });

    conn.on('data', (msg) => {
      const data = JSON.parse(msg) as ClientWsData;
      console.log(data);

      if (data.type === 'draw') return this.boardcast(data);

      if (data.type === 'message') {
        if (data.subtype === 'chat') {
          if (data.data === this.currentAnswer) return conn.info('E_SEND_ANSWER');
          return this.boardcast({ ...data, sender: conn.id });
        }

        if (data.subtype === 'answer') {
          if (!this.state) return conn.info('E_NOT_START');
          if (this.state === conn.id) return conn.info('E_DRAW');
          if (data.data === this.currentAnswer) {
            this.getPlayer(conn.id).score += Math.max(10 - Object.keys(this.success).length, 3);
            this.getPlayer(this.state).score += 3;
            this.boardcast({
              type: 'score',
              data: Math.max(10 - Object.keys(this.success).length, 3),
              sender: conn.id,
            });
            this.boardcast({
              type: 'score',
              data: 3,
              sender: this.state,
            });
            this.success[conn.id] = true;
            return this.boardcast({
              type: 'message',
              subtype: 'info',
              data: 'CORRECT',
              sender: conn.id,
            });
          }
          return this.boardcast({
            type: 'message',
            subtype: 'answer',
            data: data.data,
            sender: conn.id,
          });
        }
      }

      if (data.type === 'start') {
        if (!this.state) return conn.info('E_STARTED');
        if (!this.getPlayer(conn.id).owner) return conn.info('E_NOT_OWNER');
        this.startGame();
      }
      return null;
    });

    conn.on('close', () => {
      this.players = this.players.filter((v) => v.id !== conn.id);
      delete this.connections[conn.id];
      this.boardcast({
        type: 'player',
        subtype: 'remove',
        data: conn.id,
      });
    });
  }
}

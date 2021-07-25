import sockjs from 'sockjs';
import crypto from 'crypto';
import { Server } from 'http';
import { IPlayer, ClientWsData, ServerWsData } from './types';
import Words from './words';
import { Logger } from './logger';

type STATE_WAITING = 0;
const STATE_WAITING = 0;
export type GAME_STATE = STATE_WAITING | string;

export const WIN_SCORE = 100;

const logger = new Logger('game');
const sockLogger = new Logger('sockjs');
const chatLogger = new Logger('chat');
const sockLog = (v: string, fmt: string, ...args: any[]) => sockLogger.debug(fmt, ...args);

export default class Game {
  players: IPlayer[] = [];
  connections: Record<string, sockjs.Connection> = {};
  state: GAME_STATE = STATE_WAITING;
  sockjs = sockjs.createServer({ prefix: '/room', log: sockLog });
  currentAnswer: [string, string] = ['', ''];
  success: Record<string, boolean> = {};
  startGameInterval: any;
  finishRoundInterval: any;
  startTime: number | null = null;
  playerMap: Record<string, IPlayer> = {}; // email to userid

  public constructor(public server: Server) {
    this.sockjs.on('connection', this.onConnection.bind(this));
    this.sockjs.installHandlers(server, { prefix: '/room' });
    this.startGame = this.startGame.bind(this);
    this.finishRound = this.finishRound.bind(this);
    logger.info('started');
  }

  public boardcast(msg: ServerWsData) {
    for (const player of this.players) this.connections[player.id].send(msg);
  }

  public score(id: string, score: number) {
    const player = this.getPlayer(id);
    logger.info('add score, player: %s, score: %d', player.username, score);
    player.score += score;
    return this.boardcast({
      type: 'score',
      data: score,
      sender: id,
    });
  }

  public getPlayer(name: string) {
    return this.players.filter((i) => i.id === name)[0];
  }

  public startGame() {
    if (this.players.length < 2) return false;
    this.startTime = new Date().valueOf();
    this.currentAnswer = [Words[Math.floor(Math.random() * Words.length)], Words[Math.floor(Math.random() * Words.length)]];
    this.state = this.players[0].id;
    // @ts-ignore
    this.players.push(this.players.shift());
    this.boardcast({ type: 'start', subtype: 'guess', data: this.state });
    this.connections[this.state].send({ type: 'start', subtype: 'draw', data: this.currentAnswer.join(' 或 ') });
    this.success = {};
    this.finishRoundInterval = setTimeout(this.finishRound, 60000);

    logger.info('start game, answer: %o, draw: %s', this.currentAnswer, this.getPlayer(this.state).username);

    return true;
  }

  public finishRound() {
    logger.info('finish round');
    this.boardcast({ type: 'message', subtype: 'currentAnswer', data: this.currentAnswer.join(' 或 ') });
    this.startGameInterval = setTimeout(this.startGame, 10000);
    this.checkWinned();
  }

  public resetRoom() {
    logger.info('reset room');
    this.boardcast({ type: 'start', subtype: 'guess', data: '' });
    clearInterval(this.startGameInterval);
    clearInterval(this.finishRoundInterval);
    this.state = STATE_WAITING;
    this.players.forEach((v) => {
      v.score = 0;
    });
    this.boardcast({
      type: 'players',
      data: this.players,
    });
  }

  public checkWinned() {
    const winner = this.players.find((v) => v.score >= WIN_SCORE);
    if (winner) {
      clearTimeout(this.startGameInterval);
      clearTimeout(this.finishRoundInterval);
    }
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

    conn.on('data', (msg) => {
      const data = JSON.parse(msg) as ClientWsData;

      if (data.type === 'hello') {
        p.avatarUrl = `https://dn-qiniu-avatar.qbox.me/avatar/${crypto.createHash('md5').update(data.data.email).digest('hex')}.jpg`;
        p.username = data.data.username;
        if (!data.data.email) {
          conn.send({
            type: 'message',
            subtype: 'info',
            data: 'E_NO_EMAIL',
          });
          return conn.close();
        }

        if (this.playerMap[data.data.email]) {
          logger.info('restored user score, user: %o', p);
          p.score = this.playerMap[data.data.email].score;
        } else {
          this.playerMap[data.data.email] = p;
        }
        this.players.push(p);
        logger.info('player joined, %o', p);

        this.boardcast({
          type: 'player',
          subtype: 'add',
          data: p,
        });
        conn.send({
          type: 'players',
          data: this.players,
        });
        conn.send({
          type: 'selfId',
          data: conn.id,
        });
      }

      if (data.type === 'draw') return this.boardcast(data);

      if (data.type === 'message') {
        if (data.subtype === 'chat') {
          if (this.currentAnswer.includes(data.data)) return conn.info('E_SEND_ANSWER');
          chatLogger.info('[chat] %s: %s', p.username, data.data);
          return this.boardcast({ ...data, sender: conn.id });
        }

        if (data.subtype === 'answer') {
          if (!this.state) return conn.info('E_NOT_START');
          if (this.success[conn.id]) return conn.info('E_SUCCESS');
          if (this.state === conn.id) return conn.info('E_DRAW');
          if ((new Date().valueOf() - this.startTime!) > 60 * 10000) return conn.info('E_FINISHED');
          chatLogger.info('[answer] %s: %s', p.username, data.data);
          if (this.currentAnswer.includes(data.data)) {
            this.score(conn.id, Math.max(10 - Object.keys(this.success).length, 3));
            this.score(this.state, 3);
            this.success[conn.id] = true;
            if (Object.keys(this.success).length === this.players.length - 1) {
              clearTimeout(this.finishRoundInterval);
              this.finishRound();
            }

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
        if (this.state) return conn.info('E_STARTED');
        if (!this.getPlayer(conn.id).owner) return conn.info('E_NOT_OWNER');
        this.startGame();
      }

      if (data.type === 'skip') {
        if (!this.state) return conn.info('E_NOT_STARTED');
        if (conn.id !== this.state) return conn.info('E_NOT_CURRENT');
        clearTimeout(this.finishRoundInterval);
        this.finishRound();
      }
      return null;
    });

    conn.on('close', () => {
      this.players = this.players.filter((v) => v.id !== conn.id);
      delete this.connections[conn.id];
      this.boardcast({
        type: 'player',
        subtype: 'remove',
        data: p,
      });
      logger.info('player left, %o', p);
      if (this.players.length <= 1) {
        this.resetRoom();
      }
      if (!this.players.find((v) => v.owner) && this.players.length) {
        this.players[0].owner = true;
        this.boardcast({
          type: 'players',
          data: this.players,
        });
      }
    });
  }
}

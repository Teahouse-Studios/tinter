import sockjs from 'sockjs';
import crypto from 'crypto';
import { Server } from 'http';
import {
  IPlayer, ClientWsData, ServerWsData, GAME_STATE,
} from './types';
import Words from './words';
import { Logger } from './logger';

const STATE_WAITING = 0;

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
  alternativeAnswers: [string, string] = ['', ''];
  answer: string;
  success: Record<string, boolean> = {};
  startGameTimeout: NodeJS.Timeout;
  finishRoundTimeout: NodeJS.Timeout;
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
    this.alternativeAnswers = [Words[Math.floor(Math.random() * Words.length)], Words[Math.floor(Math.random() * Words.length)]];
    this.state = this.players[0].id;
    this.players.push(this.players.shift());
    this.boardcast({ type: 'start', subtype: 'guess', data: this.state });
    this.connections[this.state].send({ type: 'start', subtype: 'draw', data: JSON.stringify(this.alternativeAnswers) });
    this.success = {};
    this.answer = '';
    this.finishRoundTimeout = setTimeout(() => this.finishRound(true), 10000);
    logger.info('start game, answers: %o, draw: %s', this.alternativeAnswers, this.getPlayer(this.state).username);
    this.boardcastSuccess();
    return true;
  }

  public finishRound(skip = false) {
    clearTimeout(this.startGameTimeout);
    clearTimeout(this.finishRoundTimeout);
    logger.info('finish round');
    this.boardcast({
      type: 'message', subtype: 'currentAnswer', data: skip ? 'skipped' : this.answer, sender: this.state.toString(),
    });
    this.startGameTimeout = setTimeout(this.startGame, 10000);
    this.checkWinned();
  }

  public resetRoom() {
    logger.info('reset room');
    this.boardcast({ type: 'start', subtype: 'guess', data: '' });
    clearTimeout(this.startGameTimeout);
    clearTimeout(this.finishRoundTimeout);
    this.state = STATE_WAITING;
    this.players.forEach((v) => {
      v.score = 0;
    });
    this.boardcast({
      type: 'players',
      data: this.players,
    });
  }

  public boardcastSuccess() {
    this.boardcast({
      type: 'success',
      data: this.success,
    });
  }

  public checkWinned() {
    const winner = this.players.find((v) => v.score >= WIN_SCORE);
    if (winner) {
      this.resetRoom();
      this.startGameTimeout = setTimeout(this.startGame, 10000);
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
        p.avatarUrl = `https://dn-qiniu-avatar.qbox.me/avatar/${crypto.createHash('md5').update(data.data.email || '').digest('hex')}.jpg`;
        p.username = data.data.username;
        if (!data.data.email) {
          conn.send({
            type: 'message',
            subtype: 'info',
            data: 'E_NO_EMAIL',
          });
          return conn.close();
        }

        const oldPlayer = this.playerMap[data.data.email];
        if (oldPlayer) {
          logger.info('restored user score, user: %o', p);
          p.score = oldPlayer.score;
          // remove old player
          this.players = this.players.filter((v) => v.id !== oldPlayer.id);
          logger.info('close old connection, id: %s', oldPlayer.id);
          this.connections[oldPlayer.id]?.close('4000', 'repeated player');
          delete this.connections[oldPlayer.id];
          this.playerMap[data.data.email] = p;
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

      if (data.type === 'draw' && conn.id === this.state) return this.boardcast(data);

      if (data.type === 'message') {
        if (data.subtype === 'chat') {
          if (this.alternativeAnswers.includes(data.data)) return conn.info('E_SEND_ANSWER');
          chatLogger.info('[chat] %s: %s', p.username, data.data);
          return this.boardcast({ ...data, sender: conn.id });
        }

        if (data.subtype === 'answer') {
          if (!this.state) return conn.info('E_NOT_START');
          if (this.success[conn.id]) return conn.info('E_SUCCESS');
          if (this.state === conn.id) return conn.info('E_DRAW');
          if (!this.answer) return conn.info('E_NOT_START');
          if ((new Date().valueOf() - this.startTime!) > 60 * 10000) return conn.info('E_FINISHED');
          chatLogger.info('[answer] %s: %s', p.username, data.data);
          if (data.data === this.answer) {
            this.score(conn.id, Math.max(10 - Object.keys(this.success).length, 3));
            this.score(this.state, 3);
            this.success[conn.id] = true;
            if (Object.keys(this.success).length === this.players.length - 1) {
              this.finishRound();
            }

            this.boardcastSuccess();
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
        this.finishRound(true);
      }

      if (data.type === 'select') {
        if (this.answer || !this.alternativeAnswers.includes(data.data)) {
          return null;
        }
        logger.info('selected answer: %s', data.data);
        this.answer = data.data;
        clearTimeout(this.finishRoundTimeout);
        this.finishRoundTimeout = setTimeout(this.finishRound, 60000);
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

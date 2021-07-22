import sockjs from 'sockjs';
import {IPlayer, ClientWsData, ServerWsData} from './types';
import Words from './words';
import crypto from 'crypto'

type STATE_WAITING = 0;
const STATE_WAITING = 0;
export type GAME_STATE = STATE_WAITING | string;

export default class Game {
  players: IPlayer[] = [];
  connections: Record<string, sockjs.Connection> = {};
  state: GAME_STATE = STATE_WAITING;
  sockjs = sockjs.createServer({prefix: '/room'});
  currentAnswer: string = '';
  success: Record<string, boolean> = {};
  startGameInterval: any
  finishRoundInterval: any
  startTime: number
  
  public constructor(public server) {
    this.sockjs.on('connection', this.onConnection.bind(this));
    this.sockjs.installHandlers(server, {prefix: '/room'});
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
    this.startTime = new Date().valueOf()
    this.currentAnswer = Words[Math.floor(Math.random() * Words.length)];
    this.state = this.players[0].id;
    this.players.push(this.players.shift());
    this.boardcast({type: 'start', subtype: 'guess', data: this.state});
    this.connections[this.state].send({type: 'start', subtype: 'draw', data: this.currentAnswer});
    this.success = {};
    console.log(this)
    this.startGameInterval = setTimeout(() => {
      this.startGame();
    }, 70000);
    this.finishRoundInterval = setTimeout(() => {
      this.finishRound();
    }, 60000);
    return true;
  }
  
  public finishRound() {
    this.boardcast({type: "message",subtype: "currentAnswer", data: this.currentAnswer})
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
      console.log(data);
      
      if (data.type === "hello") {
        p.avatarUrl = `https://dn-qiniu-avatar.qbox.me/avatar/${crypto.createHash('md5').update(data.data.email).digest("hex")}.jpg`
        p.username = data.data.username
        this.players.push(p);
        console.log(this.players);
        
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
          if (data.data === this.currentAnswer) return conn.info('E_SEND_ANSWER');
          return this.boardcast({...data, sender: conn.id});
        }
        
        if (data.subtype === 'answer') {
          if (!this.state) return conn.info('E_NOT_START');
          if (this.state === conn.id) return conn.info('E_DRAW');
          if ((new Date().valueOf() - this.startTime) > 60 * 10000) return conn.info('E_FINISHED')
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
            console.log(Object.keys(this.success).length, this.players.length)
            if(Object.keys(this.success).length === this.players.length - 1){
              console.log('all finished')
              clearTimeout(this.startGameInterval)
              clearTimeout(this.finishRoundInterval)
              this.finishRound()
              this.startGameInterval = setTimeout(() => {
                this.startGame()
              }, 10000)
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
      if (this.players.length === 1) {
        this.boardcast({type: 'start', subtype: 'guess', data: ''});
        clearInterval(this.startGameInterval)
        this.state = STATE_WAITING
      }
      if (!this.players.find(v => v.owner)) {
        if (this.players.length) {
          this.players[0].owner = true
          this.boardcast({
            type: 'players',
            data: this.players,
          });
        }
      }
      
    });
  }
}

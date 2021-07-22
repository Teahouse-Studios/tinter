import {IPlayer, WsData} from "./types";
import sockjs from 'sockjs'
import {server} from "./index";

export enum GAME_STATE {
  WAITING, GAMING, FINISHED
}

export default class Game {
  players: IPlayer[] = []
  connections: {[key: string]: sockjs.Connection} = {}
  state: GAME_STATE = GAME_STATE.WAITING
  echo = sockjs.createServer({prefix: '/room'});
  public constructor() {
    this.echo.on('connection', this.onConnection.bind(this));
    this.echo.installHandlers(server, {prefix: '/room'})
  }
  private onConnection(conn: sockjs.Connection){
    let p: IPlayer = {
      id: conn.id,
      owner: this.players.length === 0
    }
    this.connections[conn.id] = conn
    this.players = [...this.players, p]
    console.log(this.players)
    conn.on('data', (msg) => {
      let data = JSON.parse(msg) as WsData
      if(data.type === "fetch_players"){
        conn.write(JSON.stringify({
          type: "players",
          data: this.players
        }))
      }else if(data.type === "submit"){
        this.players.forEach(v => {
          if(data.subtype === "chat"){
            this.connections[v.id].write(JSON.stringify({
              type: "message",
              subtype: "chat",
              // @ts-ignore
              data: {
                sender: p,
                message: data.data
              }
            }))
          }
        })
      }
    })
    conn.on('close', () => {
      this.players = this.players.filter(v => v.id !== conn.id)
      delete this.connections[conn.id]
    })
  }
}

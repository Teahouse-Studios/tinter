import {IPlayer, WsData} from "./types";
import sockjs from 'sockjs'
import {server} from "./index";

export enum GAME_STATE {
  WAITING, GAMING, FINISHED
}

export default class Game {
  players: IPlayer[] = []
  state: GAME_STATE = GAME_STATE.WAITING
  public constructor() {
    const echo = sockjs.createServer({prefix: '/room'});
    echo.on('connection', this.onConnection.bind(this));
    echo.installHandlers(server, {prefix: '/room'})
  }
  private onConnection(conn: sockjs.Connection){
    let p: IPlayer = {
      id: conn.id,
      owner: this.players.length === 0
    }
    this.players = [...this.players, p]
    console.log(this.players)
    conn.on('data', (msg) => {
      console.log(this)
      let data = JSON.parse(msg) as WsData
      if(data.type === "fetch_players"){
        conn.write(JSON.stringify({
          type: "players",
          data: this.players
        }))
      }
    })
    conn.on('close', () => {
      this.players = this.players.filter(v => v.id !== conn.id)
    })
  }
}

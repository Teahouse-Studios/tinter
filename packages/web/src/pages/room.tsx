import React, {useEffect, useRef, useState} from 'react'
import SockJS from "sockjs-client";
import {IPlayer} from "../types";
import {List, ListItem, ListItemText} from "@material-ui/core";

const sockjs = window.SockJS as typeof SockJS

const RoomPage = () => {
  const sock = useRef<WebSocket | null>(null)
  const [players, setPlayers] = useState<IPlayer[]>([])
  useEffect(() => {
    sock.current = new sockjs('http://localhost:45000/room')
    const current = sock!.current
    current.onopen = () => {
      current.send(JSON.stringify({
        type: "fetch_players"
      }))
    }
    current.onmessage = (msg) => {
      let data = JSON.parse(msg.data)
      console.log(data)
      if(data.type === "players"){
        setPlayers(data.data)
      }
    }
    return () => {
      current.close()
    }
  }, [])
  return <div>
    <List>
      {players.map(v => (
        <ListItem>
          <ListItemText primary={v.id} />
        </ListItem>
      ))}
    </List>
  </div>
}

export default RoomPage

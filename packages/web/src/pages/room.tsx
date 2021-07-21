import React, {useEffect, useRef, useState} from 'react'
import SockJS from "sockjs-client";
import {IPlayer} from "../types";
import {List, ListItem, ListItemText} from "@material-ui/core";
import Paintboard from "../components/paintboard";
import PaintboardControl, {PBData} from "../components/paintboardControl";

const sockjs = window.SockJS as typeof SockJS

const RoomPage = () => {
  const sock = useRef<WebSocket | null>(null)
  const paintboardRef = useRef<HTMLInputElement | null>(null)
  const [players, setPlayers] = useState<IPlayer[]>([])
  useEffect(() => {
    console.log(paintboardRef)
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
  const controlCallback = (data: PBData) => {
    console.log(data)
    if(paintboardRef.current){
      // @ts-ignore
      paintboardRef.current.update(data)
    }
  }
  return <div>
    <PaintboardControl callback={controlCallback}/>
    <Paintboard ref={paintboardRef}/>
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

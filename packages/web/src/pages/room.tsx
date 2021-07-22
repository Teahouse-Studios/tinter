import React, {useEffect, useRef, useState} from 'react'
import SockJS from "sockjs-client";
import {IMessage, IPlayer} from "../types";
import {Grid, List, ListItem, ListItemText} from "@material-ui/core";
import Paintboard from "../components/paintboard";
import PaintboardControl, {PBData} from "../components/paintboardControl";
import GameChat from "../components/chat";

const sockjs = window.SockJS as typeof SockJS

const RoomPage = () => {
  const sock = useRef<WebSocket | null>(null)
  const paintboardRef = useRef<HTMLInputElement | null>(null)
  const [players, setPlayers] = useState<IPlayer[]>([])
  const [chat, setChat] = useState<IMessage[]>([])
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
      }else if(data.type === "message"){
      
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
  const submitContent = (type: "game" | "chat", message: string) => {
    sock.current?.send(JSON.stringify({
      type: "submit",
      subtype: type,
      data: message
    }))
  }
  return <div>
    <Grid container spacing={2}>
      <Grid item xs={10}>
        <PaintboardControl callback={controlCallback}/>
        <Paintboard ref={paintboardRef}/>
      </Grid>
      <Grid item xs={2}>
        <List>
          {players.map(v => (
            <ListItem>
              <ListItemText primary={v.id} />
            </ListItem>
          ))}
        </List>
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <GameChat type={"game"} onSubmit={submitContent}/>
      </Grid>
      <Grid item xs={6}>
        <GameChat type={"chat"}  onSubmit={submitContent}/>
      </Grid>
    </Grid>
  </div>
}

export default RoomPage

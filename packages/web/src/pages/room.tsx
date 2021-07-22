import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import {
  Grid, List, ListItem, ListItemText,
} from '@material-ui/core';
import type { ServerWsData } from '../../../server/src/types';
import { IPlayer } from '../types';
import Paintboard from '../components/paintboard';
import PaintboardControl, { PBData } from '../components/paintboardControl';
import GameChat from '../components/chat';

const Sockjs = window.SockJS as SockJS;

const RoomPage = () => {
  const sock = useRef<WebSocket | null>(null);
  const paintboardRef = useRef<HTMLInputElement | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [chat, setChat] = useState<ServerWsData[]>([]);
  useEffect(() => {
    console.log(paintboardRef);
    sock.current = new Sockjs('http://localhost:45000/room');
    const current = sock!.current;
    current.onopen = () => {
      current.send(JSON.stringify({
        type: 'fetch_players',
      }));
    };
    current.onmessage = (msg) => {
      const data = JSON.parse(msg.data) as ServerWsData;
      console.log(data);
      if (data.type === 'players') {
        setPlayers(data.data);
      } else if (data.type === 'message') {
        setChat([...chat, data.data]);
      }
    };
    return () => {
      current.close();
    };
  }, []);
  const controlCallback = (data: PBData) => {
    console.log(data);
    if (paintboardRef.current) {
      // @ts-ignore
      paintboardRef.current.update(data);
    }
  };
  const submitContent = (type: 'answer' | 'chat', message: string) => {
    sock.current?.send(JSON.stringify({
      type: 'message',
      subtype: type,
      data: message,
    }));
  };
  return <div>
    <Grid container spacing={2}>
      <Grid item xs={10}>
        <PaintboardControl callback={controlCallback}/>
        <Paintboard ref={paintboardRef}/>
      </Grid>
      <Grid item xs={2}>
        <List>
          {players.map((v) => (
            <ListItem>
              <ListItemText primary={v.id} />
            </ListItem>
          ))}
        </List>
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <GameChat type={'answer'} onSubmit={submitContent} chat={chat}/>
      </Grid>
      <Grid item xs={6}>
        <GameChat type={'chat'} onSubmit={submitContent} chat={chat}/>
      </Grid>
    </Grid>
  </div>;
};

export default RoomPage;

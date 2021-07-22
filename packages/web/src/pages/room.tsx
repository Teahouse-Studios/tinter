import React, {useEffect, useMemo, useRef, useState} from 'react';
import SockJS from 'sockjs-client';
import {
  Avatar,
  Button,
  Grid, LinearProgress, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Typography,
} from '@material-ui/core';
import type {ServerMessageEvent, ServerWsData} from '../../../server/src/types';
import {IPlayer} from '../types';
import Paintboard from '../components/paintboard';
import PaintboardControl, {PBData} from '../components/paintboardControl';
import GameChat from '../components/chat';
import type {GAME_STATE} from "../../../server/src/game";
import useInterval from "../components/useInterval";

const Sockjs = window.SockJS as typeof SockJS;

const RoomPage = () => {
  const sock = useRef<WebSocket | null>(null);
  const paintboardRef = useRef<HTMLInputElement | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const playersRef = useRef<IPlayer[]>([])
  const [chat, setChat] = useState<ServerMessageEvent[]>([]);
  const chatRef = useRef<ServerMessageEvent[]>([])
  const [selfId, setSelfId] = useState('')
  const ownerId = useMemo(() => players.find(v => v.owner)?.id, [players])
  const stateRef = useRef<GAME_STATE>(0)
  const [drawing, setDrawing] = useState('')
  const drawingRef = useRef('')
  useEffect(() => {
    console.log(paintboardRef);
    sock.current = new Sockjs('http://localhost:45000/room');
    const current = sock!.current;
    current.onopen = () => {
      // @ts-ignore
      let user = {
        username: Math.random(),
        email: ''
      }
      if(localStorage.getItem("user")){
        user = JSON.parse(localStorage.getItem("user") || "")
      }
      current.send(JSON.stringify({
        type: 'hello',
        data: user
      }));
      current.send(JSON.stringify({
        type: 'fetch_players',
      }));
    };
    current.onmessage = (msg) => {
      const data = JSON.parse(msg.data) as ServerWsData;
      if (data.type === 'players') {
        setPlayers(data.data);
        playersRef.current = data.data
      }
      if (data.type === "player") {
        if (data.subtype === "add") {
          playersRef.current =[...playersRef.current, data.data]
          setPlayers(playersRef.current)
        } else if (data.subtype === "remove") {
          playersRef.current = playersRef.current.filter(v => v.id !== data.data.id)
          setPlayers(playersRef.current)
        }
      } else if (data.type === 'selfId') {
        setSelfId(data.data)
      } else if (data.type === 'message') {
        chatRef.current = [...chatRef.current, data]
        setChat(chatRef.current);
        if(data.subtype === "currentAnswer"){
          setTime(10)
          setTimeMax(10)
          setDrawing('')
        }
      } else if(data.type === "start"){
        setProgressType('determinate')
        // @ts-ignore
        paintboardRef.current?.update({type: "clear"});
        setTime(60)
        setTimeMax(60)
        if(data.subtype === "guess"){
          stateRef.current = data.data
          if(data.data !== selfId){
            setDrawing('')
            drawingRef.current = ''
          }
        }else if(data.subtype === "draw"){
          stateRef.current = selfId
          setDrawing(data.data)
          drawingRef.current = data.data
        }
      }else if(data.type === "draw"){
        if(!drawingRef.current){
          // @ts-ignore
          paintboardRef.current?.draw(data)
        }
      } else if (data.type === "score"){
        playersRef.current = playersRef.current.map(v => {
          if(v.id === data.sender){
            v.score ||= 0;
            v.score += data.data
          }
          return v
        })
        setPlayers(playersRef.current)
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
  const startGame = () => {
    sock.current?.send(JSON.stringify({
      type: "start"
    }))
  }
  useEffect(() => {
    if(players.length < 2){
      setProgressType('indeterminate')
    }
  }, [players])
  const [timeMax, setTimeMax] = useState(0)
  const [time, setTime] = useState(0)
  const [progressType, setProgressType] = useState<'determinate' | 'indeterminate'>('indeterminate')
  useInterval(() => {
    setTime(time-1)
  }, 1000)
  const progress = useMemo(() => time / timeMax * 100, [time, timeMax])
  return <div>
    <Grid container spacing={2}>
      <Grid item xs={9}>
        {players.length < 2 && '您是房主, 等待更多玩家中...'}
        {drawing && (
          <Typography>请画 {drawing}</Typography>
        )}
        {drawing && (
          <PaintboardControl callback={controlCallback}/>
        )}
        <Paintboard ref={paintboardRef} disabled={!drawing} sockjs={sock.current}/>
        <LinearProgress variant={progressType} value={progress} />
      </Grid>
      <Grid item xs={3}>
        <List>
          {players.map((v) => (
            <ListItem>
              <ListItemAvatar>
                <Avatar src={v.avatarUrl} />
              </ListItemAvatar>
              <ListItemText primary={v.username + (v.owner ? '(Owner)' : '')} secondary={v.score + '分'}/>
            </ListItem>
          ))}
        </List>
      </Grid>
    </Grid>
    {ownerId === selfId && players.length >= 2 && !stateRef.current && (
      <Button variant={"outlined"} color={"primary"} onClick={startGame}>开始</Button>
    )}
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <GameChat type={'answer'} onSubmit={submitContent} chat={chat} players={players}/>
      </Grid>
      <Grid item xs={6}>
        <GameChat type={'chat'} onSubmit={submitContent} chat={chat} players={players}/>
      </Grid>
    </Grid>
    <div>
      <Typography variant={"h5"}>Debug</Typography>
      <Typography>ownerId {ownerId}</Typography>
      <Typography>selfId {selfId}</Typography>
    </div>
  </div>;
};

export default RoomPage;

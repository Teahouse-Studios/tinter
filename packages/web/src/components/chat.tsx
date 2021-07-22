import React, {useEffect, useMemo, useRef, useState} from 'react';
import {TextField, Typography, useTheme} from '@material-ui/core';
import type {ServerWsData} from '../../../server/src/types';
import {IPlayer} from "../types";
import type {ServerMessageEvent} from "../../../server/src/types";

interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ServerMessageEvent[]
  players: IPlayer[]
}

const GameChat: React.FunctionComponent<IProps> = ({type, onSubmit, chat, players}) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const list = useMemo(() => {
    if (type === 'answer') {
      return chat.filter(v => v.subtype === 'answer')
    } else {
      return chat.filter(v => v.subtype === 'chat' || v.subtype === 'info')
    }
  }, [chat, type])
  const listDom = useRef()
  useEffect(() => {
    if(listDom.current){
      listDom.current.scrollTo(0, listDom.current.clientHeight)
    }
  }, [list])
  return <div>
    <div style={{maxHeight: 400, overflow: 'auto'}} ref={listDom}>
      <Typography variant={'h5'}>{type === 'answer' ? '猜' : '聊天'}</Typography>
      {list.map((v) => (
        <div style={{lineBreak: 'anywhere'}}>{players.find(p => p.id === v.sender)?.username || "Unknown"} {v.data}</div>
      ))}
    </div>
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('submit');
      onSubmit(type, input);
      setInput('');
    }}>
      <TextField fullWidth variant={'outlined'} label={'输入内容'} onChange={(e) => setInput(e.target.value)}
                 autoComplete={'off'} value={input} style={{marginTop: theme.spacing(2)}}/>
    </form>
  </div>;
};

export default GameChat;

import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Box, Paper, TextField, Typography, useTheme,
} from '@material-ui/core';
import { IPlayer } from '../types';
interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ILocalMessage[]
  players: IPlayer[]
}

export interface ILocalMessage {
  sender?:string;
  data: string;
  color?: string;
}

const GameChat: React.FunctionComponent<IProps> = ({
  type, onSubmit, chat, players,
}) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const listDom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listDom.current?.scrollTo(0, listDom.current.scrollHeight);
  }, [chat]);
  return <Paper variant={'outlined'}>
    <Box p={2}>
      <Typography variant={'h5'}>{type === 'answer' ? '猜' : '聊天'}</Typography>
      <div style={{ height: '20vh', overflow: 'auto' }} ref={listDom}>
        {chat.map((v,i) => (
          <div key={i} style={{ lineBreak: 'anywhere' }}>{v.sender} {v.data}</div>
        ))}
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(type, input);
        setInput('');
      }}>
        <TextField fullWidth variant={'outlined'} label={'输入内容'} onChange={(e) => setInput(e.target.value)}
          autoComplete={'off'} value={input} style={{ marginTop: theme.spacing(2) }} />
      </form>
    </Box>
  </Paper>;
};

export default GameChat;

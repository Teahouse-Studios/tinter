import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Box, Paper, TextField, Typography, useTheme,
} from '@material-ui/core';
import { IPlayer } from '../types';
import type { ServerMessageEvent } from '../../../server/src/types';

interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ServerMessageEvent[]
  players: IPlayer[]
}

const GameChat: React.FunctionComponent<IProps> = ({
  type, onSubmit, chat, players,
}) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const list = useMemo(() => {
    if (type === 'answer') {
      return chat.filter((v) => v.subtype === 'answer' || v.subtype === 'currentAnswer').map((v) => {
        if (v.subtype === 'currentAnswer') {
          v.sender = 'SYSTEM';
        }
        return v;
      });
    }
    return chat.filter((v) => v.subtype === 'chat' || v.subtype === 'info');
  }, [chat, type]);
  const listDom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listDom.current?.scrollTo(0, listDom.current.scrollHeight);
  }, [list]);
  return <Paper variant={'outlined'}>
    <Box p={2}>
      <Typography variant={'h5'}>{type === 'answer' ? '猜' : '聊天'}</Typography>
      <div style={{ height: '20vh', overflow: 'auto' }} ref={listDom}>
        {list.map((v) => (
          <div style={{ lineBreak: 'anywhere' }}>{players.find((p) => p.id === v.sender)?.username || v.sender || 'Unknown'} {v.data}</div>
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

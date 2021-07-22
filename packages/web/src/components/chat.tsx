import React, {useMemo, useState} from 'react';
import {TextField, Typography, useTheme} from '@material-ui/core';
import type {ServerWsData} from '../../../server/src/types';
import {IPlayer} from "../types";

interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ServerWsData[]
  players: IPlayer[]
}

const GameChat: React.FunctionComponent<IProps> = ({type, onSubmit, chat, players}) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const list = useMemo(() => chat.filter(v => v.subtype === type), [chat, type])
  return <div>
    <Typography variant={'h5'}>{type === 'answer' ? '猜' : '聊天'}</Typography>
    {list.map((v) => (
      <div>{v.sender} {v.data}</div>
    ))}
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

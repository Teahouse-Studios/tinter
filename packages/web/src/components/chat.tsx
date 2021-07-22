import React, { useState } from 'react';
import { TextField, Typography, useTheme } from '@material-ui/core';
import { IMessage } from '../types';
import {ServerWsData} from '@teahouse/guess-server'
interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ServerWsData[]
}

const GameChat: React.FunctionComponent<IProps> = ({ type, onSubmit, chat }) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  return <div>
    <Typography variant={'h5'}>{type === 'answer' ? '猜' : '聊天'}</Typography>
    {chat.map((v) => (
      <div>{v.data}</div>
    ))}
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('submit');
      onSubmit(type, input);
      setInput('');
    }}>
      <TextField fullWidth variant={'outlined'} label={'输入内容'} onChange={(e) => setInput(e.target.value)}
        autoComplete={'off'} value={input} style={{ marginTop: theme.spacing(2) }}/>
    </form>
  </div>;
};

export default GameChat;

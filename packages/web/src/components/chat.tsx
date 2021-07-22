import React, { useState } from 'react';
import { TextField, Typography, useTheme } from '@material-ui/core';

interface IProps {
  type: 'game' | 'chat'
  onSubmit: (type: 'game' | 'chat', message: string) => any
}

const GameChat: React.FunctionComponent<IProps> = ({ type, onSubmit }) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  return <div>
    <Typography variant={'h5'}>{type === 'game' ? '猜' : '聊天'}</Typography>
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

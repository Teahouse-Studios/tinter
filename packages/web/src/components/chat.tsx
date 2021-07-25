import { Card } from '@blueprintjs/core';
import React, {
  useEffect, useRef, useState,
} from 'react';
import { IPlayer } from '../types';
interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ILocalMessage[]
  players: IPlayer[]
}

export interface ILocalMessage {
  sender?: string;
  data: string;
  color?: string;
}

const GameChat: React.FunctionComponent<IProps> = ({
  type, onSubmit, chat,
}) => {
  const [input, setInput] = useState('');
  const listDom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listDom.current?.scrollTo(0, listDom.current.scrollHeight);
  }, [chat]);
  return <Card style={{
    padding: 16, height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ alignItems: 'flex-start', flexGrow: 1 }}>
      <h2>{type === 'answer' ? '猜' : '聊天'}</h2>
      <div style={{ overflowY: 'scroll', height: '100px' }} ref={listDom}>
        {chat.map((v, i) => (
          <div key={i} style={{ lineBreak: 'anywhere' }}>{v.sender} {v.data}</div>
        ))}
      </div>
    </div>
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(type, input);
      setInput('');
    }} style={{ alignItems: 'stretch' }}>
      <input placeholder={'输入内容'} onChange={(e) => setInput(e.target.value)} autoComplete={'off'} value={input} />
    </form>
  </Card>;
};

export default GameChat;

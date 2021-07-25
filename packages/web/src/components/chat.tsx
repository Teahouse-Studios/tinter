import React, {
  useEffect, useRef, useState,
} from 'react';
import { Input } from '@chakra-ui/react';
interface IProps {
  type: 'answer' | 'chat'
  onSubmit: (type: 'answer' | 'chat', message: string) => any
  chat: ILocalMessage[]
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
  const [focus, setFocus] = useState(false);
  const listDom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listDom.current?.scrollTo(0, listDom.current.scrollHeight);
  }, [chat]);
  return <div style={{
    padding: 16, height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ alignItems: 'flex-start', flexGrow: 1 }}>
      <h2>{type === 'answer' ? '猜' : '聊天'}</h2>
      <div style={{ overflowY: 'scroll', height: '100px' }} ref={listDom}>
        {chat.map((v, i) => (
          <div key={i} style={{ lineBreak: 'anywhere' }}><b>{v.sender}</b> {v.data}</div>
        ))}
      </div>
    </div>
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!input.trim()) return;
      onSubmit(type, input);
      setInput('');
    }} style={{ alignItems: 'stretch' }}>
      <Input
        tabIndex={focus ? 1 : type === 'answer' ? 2 : 3}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={'输入内容'}
        onChange={(e) => setInput(e.target.value)}
        autoComplete={'off'}
        value={input}
      />
    </form>
  </div>;
};

export default GameChat;

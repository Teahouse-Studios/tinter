import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import SockJS from 'sockjs-client';
import { useHistory } from 'react-router-dom';
import {
  Button, Card, Intent, Menu, MenuItem, Position, ProgressBar, Toaster,
} from '@blueprintjs/core';
import type { ServerWsData } from '../../../server/src/types';
import { IPlayer } from '../types';
import Paintboard from '../components/paintboard';
import PaintboardControl, { PBData } from '../components/paintboardControl';
import GameChat, { ILocalMessage } from '../components/chat';
import type { GAME_STATE } from '../../../server/src/game';
import useInterval from '../components/useInterval';
import './room.css';
const Sockjs = window.SockJS as typeof SockJS;

const ToasterContainer = document.createElement('div');
ToasterContainer.style.position = 'fixed';
ToasterContainer.style.bottom = '0px';
ToasterContainer.style.zIndex = '9999';
document.body.append(ToasterContainer);

const AppToaster = Toaster.create({
  className: 'recipe-toaster',
  position: Position.TOP,
  usePortal: true,
}, ToasterContainer);

const RoomPage = () => {
  const history = useHistory();
  const sock = useRef<WebSocket | null>(null);
  const paintboardRef = useRef<HTMLInputElement | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const playersRef = useRef<IPlayer[]>([]);
  const [selfId, setSelfId] = useState('');
  const ownerId = useMemo(() => players.find((v) => v.owner)?.id, [players]);
  const stateRef = useRef<GAME_STATE>(0);
  const [drawing, setDrawing] = useState('');
  const drawingRef = useRef('');
  const [timeMax, setTimeMax] = useState(0);
  const [time, setTime] = useState(0);
  const [progressType, setProgressType] = useState<'determinate' | 'indeterminate'>('indeterminate');

  const [answerChat, setAnswerChat] = useState<ILocalMessage[]>([]);
  const answerChatRef = useRef<ILocalMessage[]>([]);
  const [chat, setChat] = useState<ILocalMessage[]>([]);
  const chatRef = useRef<ILocalMessage[]>([]);

  const createConnection = () => {
    // @ts-ignore
    sock.current = new Sockjs(import.meta.env.VITE_SERVER || 'http://localhost:45000/room');
    const current = sock!.current;
    current.onopen = () => {
      AppToaster.show({ message: '服务器连接成功', intent: Intent.SUCCESS });
      // @ts-ignore
      let user = {
        username: Math.random(),
        email: '',
      };
      if (localStorage.getItem('user')) {
        user = JSON.parse(localStorage.getItem('user') || '');
      }
      current.send(JSON.stringify({
        type: 'hello',
        data: user,
      }));
      current.send(JSON.stringify({
        type: 'fetch_players',
      }));
    };
    current.onclose = (msg) => {
      console.log(msg);
      AppToaster.show({ message: '连接中断, 5秒后重试', intent: Intent.DANGER });
      setTimeout(createConnection, 5000);
    };
    current.onmessage = (msg) => {
      const data = JSON.parse(msg.data) as ServerWsData;
      if (data.type === 'players') {
        setPlayers(data.data);
        playersRef.current = data.data;
      }
      if (data.type === 'player') {
        if (data.subtype === 'add') {
          playersRef.current = [...playersRef.current, data.data];
          setPlayers(playersRef.current);
        } else if (data.subtype === 'remove') {
          playersRef.current = playersRef.current.filter((v) => v.id !== data.data.id);
          setPlayers(playersRef.current);
        }
      } else if (data.type === 'selfId') {
        setSelfId(data.data);
      } else if (data.type === 'message') {
        const player = playersRef.current.find((v) => v.id === data.sender);
        if (data.subtype === 'chat') {
          chatRef.current = [...chatRef.current, {
            data: data.data,
            sender: player!.username,
          }];
          setChat(chatRef.current);
        } else if (data.subtype === 'currentAnswer') {
          setTime(10);
          setTimeMax(10);
          setDrawing('');
        } else if (data.subtype === 'info') {
          const gameInfoMap = {
            E_NOT_START: '游戏未开始',
            E_SUCCESS: '你已经猜出来了',
            E_DRAW: '想泄题吗(',
            E_FINISHED: '本轮已结束',
          };
          const gameChatMap = {
            E_SEND_ANSWER: '不许发答案',
          };
          type infoKey = keyof typeof gameInfoMap;
          type chatKey = keyof typeof gameChatMap;
          if (Object.keys(gameInfoMap).includes(data.data)) {
            answerChatRef.current = [...answerChatRef.current, {
              data: gameInfoMap[data.data as infoKey],
            }];
            setAnswerChat(answerChatRef.current);
          } else if (Object.keys(gameChatMap).includes(data.data)) {
            chatRef.current = [...chatRef.current, {
              data: gameChatMap[data.data as chatKey],
            }];
            setChat(chatRef.current);
          } else if (data.data === 'E_NO_EMAIL') {
            alert('请先设置 email');
            history.push('/');
          }
        } else if (data.subtype === 'answer') {
          const p = playersRef.current.find((v) => v.id === data.sender);
          answerChatRef.current = [...answerChatRef.current, {
            data: data.data,
            sender: p?.username,
          }];
          setAnswerChat(answerChatRef.current);
        } else {
          console.log(data);
        }
      } else if (data.type === 'start') {
        setProgressType('determinate');
        // @ts-ignore
        paintboardRef.current?.update({ type: 'clear' });
        setTime(60);
        setTimeMax(60);
        if (data.subtype === 'guess') {
          stateRef.current = data.data;
          if (data.data !== selfId) {
            setDrawing('');
            drawingRef.current = '';
          }
        } else if (data.subtype === 'draw') {
          stateRef.current = selfId;
          setDrawing(data.data);
          drawingRef.current = data.data;
        }
      } else if (data.type === 'draw') {
        if (!drawingRef.current) {
          // @ts-ignore
          paintboardRef.current?.draw(data);
        }
      } else if (data.type === 'score') {
        playersRef.current = playersRef.current.map((v) => {
          if (v.id === data.sender) {
            v.score ||= 0;
            v.score += data.data;
          }
          return v;
        });
        setPlayers(playersRef.current);
      }
    };
  };
  useEffect(() => {
    createConnection();
    return () => {
      sock.current?.close();
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
      type: 'start',
    }));
  };
  useEffect(() => {
    if (players.length < 2) {
      setProgressType('indeterminate');
    }
  }, [players]);
  useInterval(() => setTime(time - 1), 1000);
  // eslint-disable-next-line no-mixed-operators
  const progress = useMemo(() => time * 100 / timeMax / 100, [time, timeMax]);
  return <div id="container">
    <div id="content">
      <div id="users" style={{ maxHeight: document.body.clientHeight }}>
        <Card>
          {drawing && <PaintboardControl drawing={drawing} callback={controlCallback} />}
          <Button onClick={() => { document.body.requestFullscreen(); }}>EnterFullScreen</Button>
          <Menu>
            {players.map((v) => (
              <MenuItem icon={<img width="40px" src={v.avatarUrl} />} text={(
                <p>{v.username + (v.owner ? '(Owner)' : '')}<br />{v.score}分</p>
              )} />
            ))}
          </Menu>
        </Card>
      </div>
      <div id="canvas">
        <Card>
          <Paintboard ref={paintboardRef} disabled={!drawing} sockjs={sock.current} />
          <ProgressBar stripes={false} intent={Intent.PRIMARY} value={progressType === 'indeterminate' ? undefined : progress} />
          {ownerId === selfId && players.length >= 2 && !stateRef.current && !drawingRef.current && (
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Button color={'primary'} onClick={startGame}>开始</Button>
            </div>
          )}
        </Card>
      </div>
      <div id="answer">
        <GameChat type={'answer'} onSubmit={submitContent} chat={answerChat} players={players} />
      </div>
      <div id="chat">
        <GameChat type={'chat'} onSubmit={submitContent} chat={chat} players={players} />
      </div>
    </div>
  </div >;
};

export default RoomPage;

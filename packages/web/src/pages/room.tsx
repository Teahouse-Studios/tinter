import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import SockJS from 'sockjs-client';
import { useHistory } from 'react-router-dom';

import {
  Avatar, Box, Button, Divider, Flex, Icon, Progress, Text, useMediaQuery, useToast,
} from '@chakra-ui/react';
import { Done, Edit } from '@material-ui/icons';
import type { ServerWsData, GAME_STATE } from '../../../server/src/types';
import { IPlayer } from '../types';
import Paintboard from '../components/paintboard';
import PaintboardControl, { PBData } from '../components/paintboardControl';
import GameChat, { ILocalMessage } from '../components/chat';
import useInterval from '../components/useInterval';
import './room.css';
import SuccessSoundFile from '../sounds/success.wav';
import NextSoundFile from '../sounds/next.wav';
import DrawSoundFile from '../sounds/draw.wav';
const Sockjs = window.SockJS as typeof SockJS;

const SuccessSound = new Audio(SuccessSoundFile);
const NextSound = new Audio(NextSoundFile);
const DrawSound = new Audio(DrawSoundFile);

const RoomPage = () => {
  const toast = useToast();
  const history = useHistory();
  const sock = useRef<WebSocket | null>(null);
  // @ts-ignore
  window.sock = sock;
  const paintboardRef = useRef<HTMLInputElement | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const playersRef = useRef<IPlayer[]>([]);
  const [selfId, setSelfId] = useState('');
  const selfIdRef = useRef('');
  const ownerId = useMemo(() => players.find((v) => v.owner)?.id, [players]);
  const stateRef = useRef<GAME_STATE>(0);
  const [alternatives, setAlternatives] = useState<[string, string]>(['', '']);
  const alternativesRef = useRef<[string, string]>(['', '']);
  const [drawing, setDrawing] = useState('');
  const drawingRef = useRef('');
  const [timeMax, setTimeMax] = useState(0);
  const [time, setTime] = useState(0);
  const [progressType, setProgressType] = useState<'determinate' | 'indeterminate'>('indeterminate');

  const [answerChat, setAnswerChat] = useState<ILocalMessage[]>([]);
  const answerChatRef = useRef<ILocalMessage[]>([]);
  const [chat, setChat] = useState<ILocalMessage[]>([]);
  const chatRef = useRef<ILocalMessage[]>([]);

  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const createConnection = () => {
    // @ts-ignore
    sock.current = new Sockjs(import.meta.env.VITE_SERVER || 'http://localhost:45000/room');
    const current = sock!.current;
    current.onopen = () => {
      toast({
        title: '服务器连接成功',
      });
      // @ts-ignore
      let user = {
        username: Math.random(),
        email: '',
      };
      if (localStorage.getItem('user')) {
        user = JSON.parse(localStorage.getItem('user') || '');
      }
      if ((window as any).UserContext) {
        user.username = (window as any).UserContext.uname;
        user.email = (window as any).UserContext.mail;
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
      if (Number(msg.code) === 4000) {
        toast({
          status: 'warning',
          title: '玩家重复, 您已断开连接',
        });
      }
      // @ts-ignore
      if (msg.code !== '4000' && msg.code !== '1000') {
        toast({
          status: 'error',
          title: '连接中断, 5秒后重试',
        });
        setTimeout(createConnection, 5000);
      }
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
        selfIdRef.current = data.data;
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
          if (data.data === 'skipped') {
            answerChatRef.current = [...answerChatRef.current, {
              sender: <span style={{ color: '#ff9900' }}>{data.sender}</span>,
              data: <span style={{ color: '#ff9900' }}>错过了他的回合</span>,
            }];
          } else {
            answerChatRef.current = [...answerChatRef.current, {
              sender: <span style={{ color: '#207f4c' }}>正确答案</span>,
              data: <span style={{ color: '#207f4c' }}>{data.data}</span>,
            }];
          }
          setAnswerChat(answerChatRef.current);
          setDrawing('');
          drawingRef.current = '';
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
              data: <span style={{ color: '#2376b7' }}>{gameInfoMap[data.data as infoKey]}</span>,
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
          } else if (data.data === 'CORRECT') {
            SuccessSound.load();
            SuccessSound.play();
            if (data.data) {
              answerChatRef.current = [...answerChatRef.current, {
                sender: <span style={{ color: '#207f4c' }}>{player?.username}</span>,
                data: <span style={{ color: '#207f4c' }}>猜对了</span>,
              }];
              setAnswerChat(answerChatRef.current);
            }
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
        setTime(70);
        setTimeMax(70);
        if (data.subtype === 'guess') {
          NextSound.play();
          stateRef.current = data.data;
          if (data.data !== selfIdRef.current) {
            setDrawing('');
            drawingRef.current = '';
          }
          if (data.data) {
            const player = playersRef.current.find((v) => v.id === data.data);
            answerChatRef.current = [...answerChatRef.current, {
              sender: '下一个绘画者',
              data: player?.username || 'Unknown',
            }];
            setAnswerChat(answerChatRef.current);
          }
        } else if (data.subtype === 'draw') {
          DrawSound.play();
          stateRef.current = selfIdRef.current;
          setAlternatives(JSON.parse(data.data));
          alternativesRef.current = JSON.parse(data.data);
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
      } else if (data.type === 'success') {
        setSuccess(data.data);
      }
    };
  };
  useEffect(() => {
    sock.current?.close();
    createConnection();
    return () => sock.current?.close();
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
  const selectDrawing = (v: string) => {
    setDrawing(v);
    drawingRef.current = v;
    sock.current?.send(JSON.stringify({
      type: 'select',
      data: v,
    }));
    setAlternatives(['', '']);
  };

  const [isMobile] = useMediaQuery('(max-width: 600px)');
  useInterval(() => setTime(time - 0.05), 50);
  // eslint-disable-next-line no-mixed-operators
  const progress = useMemo(() => time * 100 / timeMax, [time, timeMax]);
  const sortedPlayers = useMemo(() => players.sort((a, b) => b.score - a.score), [players]);
  return <div id="container">
    <div id="content">
      <div id="users" style={{ maxHeight: document.body.clientHeight }}>
        <div style={{ width: '100%' }}>
          {drawing && <PaintboardControl drawing={drawing} callback={controlCallback} />}
          {/* <button onClick={() => { document.body.requestFullscreen(); }}>EnterFullScreen</button> */}
          <div style={{ width: '100%' }}>
            {(isMobile ? (stateRef.current !== selfId) : true) && sortedPlayers.map((v, i) => {
              const showIcon = success[v.id] || stateRef.current === v.id || false;
              return (
                <React.Fragment key={v.id}>
                  <Box p={2} style={{ width: '100%' }}>
                    <Flex align="center" style={{ width: '100%' }}>
                      {!isMobile && <Box mr={4} style={{ visibility: showIcon ? 'unset' : 'hidden' }}>
                        <Icon>
                          {success[v.id] && (<Done />)}
                          {stateRef.current === v.id && (<Edit />)}
                        </Icon>
                      </Box>}
                      <Box>
                        <Avatar src={v.avatarUrl} />
                      </Box>
                      <Box pl={4}>
                        <Flex direction="column">
                          <Box>
                            <Text fontSize={isMobile ? 'lg' : 'xl'} style={{ lineBreak: 'anywhere' }}>
                              {v.username}
                            </Text>
                          </Box>
                          <Box>
                            <Text>{v.score}分</Text>
                          </Box>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                  {(i !== sortedPlayers.length - 1) && <Divider />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      <div id="canvas">
        <div>
          <Paintboard ref={paintboardRef} disabled={!drawing} sockjs={sock.current} />
          <Progress isIndeterminate={progressType === 'indeterminate'} value={progress} />
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
              <Button colorScheme="blue" size={'lg'} onClick={startGame}>开始</Button>
            </div>
          )}
          {stateRef.current !== 0 && stateRef.current === selfId && !drawing && alternatives.filter((v) => v).length >= 1 && (
            <Flex style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
            }} justify="center" align="center" direction="column">
              <Text fontSize="3xl">有~什~么~呢~</Text><br />
              <Box mt={2}>
                <Button onClick={() => selectDrawing(alternatives[0])}>{alternatives[0]}</Button>
                或
                <Button onClick={() => selectDrawing(alternatives[1])}>{alternatives[1]}</Button>
              </Box>
            </Flex>
          )}
        </div>
      </div>
      <div id="answer">
        <GameChat type={'answer'} onSubmit={submitContent} chat={answerChat} disabled={success[selfId] || stateRef.current === selfId} />
      </div>
      <div id="chat">
        <GameChat type={'chat'} onSubmit={submitContent} chat={chat} />
      </div>
    </div>
  </div >;
};

export default RoomPage;

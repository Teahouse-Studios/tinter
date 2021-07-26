export interface IWord {
  word: string;
  difficulty: number;
}

export interface IPlayer {
  id: string;
  score: number;
  owner?: boolean;
  username?: string;
  avatarUrl?: string;
}

export interface DrawEvent {
  type: 'draw';
  subtype: 'point' | 'lineTo' | 'clear' | 'eraser'
  pos: [number, number];
  color: string;
}

export type ClientWsData =
  {
    type: 'message';
    subtype: 'chat' | 'answer';
    data: string;
  } | {
    type: 'start';
  } | {
    type: 'hello';
    data: {
      username: string;
      email: string;
    }
  } | {
    type: 'skip';
  } | DrawEvent;

export type ServerMessageEvent = {
  type: 'message';
  subtype: 'chat' | 'answer' | 'info' | 'currentAnswer' | 'success';
  data: string;
  sender?: string;
};

export type ServerWsData =
  {
    type: 'player';
    subtype: 'add' | 'remove';
    data: IPlayer;
  } | {
    type: 'players';
    data: IPlayer[];
  } | ServerMessageEvent | {
    type: 'start';
    subtype: 'draw' | 'guess';
    data: string;
  } | {
    type: 'success';
    data: Record<string, boolean>
  } | {
    type: 'score';
    sender: string;
    data: number;
  } | {
    type: 'selfId';
    data: string;
  } | DrawEvent;

declare module 'sockjs' {
  interface Connection {
    send: (data: ServerWsData) => void;
    info: (msg: string) => void;
  }
}
type STATE_WAITING = 0;
export type GAME_STATE = STATE_WAITING | string;

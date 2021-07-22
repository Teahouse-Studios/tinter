import sockjs from "sockjs";

export interface IWord {
  word: string;
  difficulty: number;
}

export interface IPlayer {
  id: string;
  owner?: boolean;
  username?: string;
  avatarUrl?: string;
}

export type WsData = {
  type: "fetch_players"
} | {
  type: "submit"
  subtype: "game" | "chat"
  data: string
}

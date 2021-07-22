export interface IPlayer {
  id: string;
  owner?: boolean;
  username?: string;
  avatarUrl?: string;
}

export interface IMessage {
  sender: IPlayer;
  message: string;
}

import { api, extractData } from "./request";

export type PublicMessage = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  senderName: string;
};

export type ThreadResponse = {
  messages: PublicMessage[];
  peer: {
    displayName: string;
    level: number;
    levelName: string;
  };
};

export const fetchWsToken = () =>
  api.get("/api/messages/ws-token").then(extractData) as Promise<{
    token: string;
    expiresInSeconds: number;
  }>;

export const sendMessage = (toUserId: string, body: string) =>
  api.post("/api/messages", { toUserId, body }).then(extractData) as Promise<{
    message: PublicMessage;
    messageCredits: number;
    usedCredit: boolean;
  }>;

export const fetchMessageThread = (peerUserId: string) =>
  api.get(`/api/messages/with/${peerUserId}`).then(extractData) as Promise<ThreadResponse>;

export const fetchMessageInbox = () =>
  api.get("/api/messages/inbox").then(extractData) as Promise<{
    conversations: {
      peerDisplayName: string;
      lastBody?: string;
      lastAt?: string;
      peerId: string;
    }[];
  }>;

/** Peers who sent you at least one message you have not read yet */
export const fetchUnreadPeerIds = () =>
  api.get("/api/messages/unread-peers").then(extractData) as Promise<{
    peerIds: string[];
  }>;

export const markMessagesRead = (peerUserId: string) =>
  api.post("/api/messages/mark-read", { peerUserId }).then(extractData) as Promise<{
    ok: boolean;
  }>;

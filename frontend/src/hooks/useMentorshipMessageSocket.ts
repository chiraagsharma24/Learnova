import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicMessage } from "@/fetchers/messages";
import { fetchWsToken } from "@/fetchers/messages";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:1337";

function toWsUrl(httpBase: string, token: string) {
  const wsBase = httpBase.replace(/^http/, "ws");
  return `${wsBase}/ws/messages?token=${encodeURIComponent(token)}`;
}

type WsPayload =
  | { type: "connected" }
  | { type: "error"; error: string }
  | { type: "new_message"; peerUserId: string; message: PublicMessage }
  | {
      type: "sent";
      message: PublicMessage;
      messageCredits: number;
      usedCredit: boolean;
    };

export function useMentorshipMessageSocket(handlers: {
  onNewMessage: (peerUserId: string, message: PublicMessage) => void;
  onSent: (data: {
    message: PublicMessage;
    messageCredits: number;
    usedCredit: boolean;
  }) => void;
  onError?: (msg: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(async () => {
    wsRef.current?.close();
    try {
      const { token } = await fetchWsToken();
      const ws = new WebSocket(toWsUrl(API_BASE, token));
      wsRef.current = ws;
      setReady(false);

      ws.onopen = () => setReady(true);

      ws.onerror = () => {
        setReady(false);
        handlersRef.current.onError?.("WebSocket connection error");
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as WsPayload;
          if (data.type === "new_message") {
            handlersRef.current.onNewMessage(data.peerUserId, data.message);
          } else if (data.type === "sent") {
            handlersRef.current.onSent({
              message: data.message,
              messageCredits: data.messageCredits,
              usedCredit: data.usedCredit,
            });
          } else if (data.type === "error") {
            handlersRef.current.onError?.(data.error);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setReady(false);
        wsRef.current = null;
      };
    } catch {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const sendViaSocket = useCallback((toUserId: string, body: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ type: "send", toUserId, body }));
    return true;
  }, []);

  return { ready, sendViaSocket, reconnect: connect };
}

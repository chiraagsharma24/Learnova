import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2, Send } from "lucide-react";

import { useMentorshipMessageSocket } from "@/hooks/useMentorshipMessageSocket";
import {
  fetchMessageThread,
  markMessagesRead,
  sendMessage,
  type PublicMessage,
  type ThreadResponse,
} from "@/fetchers/messages";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type Props = {
  peerUserId: string;
  peerDisplayName: string;
  onCreditsUpdate: () => void;
};

export function MentorshipChatPanel({
  peerUserId,
  peerDisplayName,
  onCreditsUpdate,
}: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [wsSending, setWsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages-thread", peerUserId],
    queryFn: () => fetchMessageThread(peerUserId),
    enabled: Boolean(peerUserId),
  });

  const messages = data?.messages ?? [];
  const headerName = data?.peer?.displayName ?? peerDisplayName;

  const appendMessage = (msg: PublicMessage) => {
    qc.setQueryData<ThreadResponse>(["messages-thread", peerUserId], (old) => {
      if (!old) {
        return {
          messages: [msg],
          peer: {
            displayName: peerDisplayName,
            level: data?.peer?.level ?? 1,
            levelName: data?.peer?.levelName ?? "",
          },
        };
      }
      if (old.messages.some((m) => m.id === msg.id)) return old;
      return { ...old, messages: [...old.messages, msg] };
    });
  };

  const { ready, sendViaSocket, reconnect } = useMentorshipMessageSocket({
    onNewMessage: (routingPeerId, msg) => {
      if (routingPeerId !== peerUserId) return;
      appendMessage(msg);
    },
    onSent: (payload) => {
      setWsSending(false);
      appendMessage(payload.message);
      onCreditsUpdate();
      toast.success(payload.usedCredit ? "Sent (1 credit used)" : "Sent");
    },
    onError: (err) => {
      setWsSending(false);
      toast.error(err);
    },
  });

  useEffect(() => {
    if (!wsSending) return;
    const t = window.setTimeout(() => setWsSending(false), 15_000);
    return () => window.clearTimeout(t);
  }, [wsSending]);

  const httpSend = useMutation({
    mutationFn: (body: string) => sendMessage(peerUserId, body),
    onSuccess: (res) => {
      appendMessage(res.message);
      onCreditsUpdate();
      toast.success(res.usedCredit ? "Sent (1 credit used)" : "Sent");
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || "Could not send");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerUserId]);

  useEffect(() => {
    if (!data || isLoading) return;
    qc.invalidateQueries({ queryKey: ["messages-unread-peers"] });
  }, [data, isLoading, peerUserId, qc]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;

    if (sendViaSocket(peerUserId, body)) {
      setWsSending(true);
      setDraft("");
      return;
    }

    setDraft("");
    httpSend.mutate(body);
  };

  const sending = wsSending || httpSend.isPending;

  return (
    <div className="flex flex-col rounded-[1.75rem] border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[420px] max-h-[min(70vh,640px)]">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chat with</p>
          <p className="font-black text-slate-900 truncate">{headerName}</p>
          {data?.peer && (
            <p className="text-xs text-slate-500 font-medium">
              L{data.peer.level} · {data.peer.levelName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {ready ? "Live" : "Connecting…"}
          </span>
          {!ready && (
            <button
              type="button"
              onClick={() => reconnect()}
              className="text-[10px] font-black text-indigo-600 hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8fafc]">
        {isLoading && (
          <div className="flex justify-center py-8 text-slate-400 text-sm font-medium">Loading messages…</div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.isMine;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                  mine
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-md"
                }`}
              >
                {!mine && (
                  <p className="text-[10px] font-bold text-indigo-600 mb-0.5">{m.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white flex gap-2 items-end">
        <textarea
          className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          placeholder="Type a message…"
          rows={2}
          value={draft}
          disabled={sending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sending && draft.trim()) handleSend();
            }
          }}
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={handleSend}
          className="shrink-0 h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

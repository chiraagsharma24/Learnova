import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Bell, HeartHandshake, MessageSquare, Sparkles } from "lucide-react";

import { MentorshipChatPanel } from "@/components/mentorship/MentorshipChatPanel";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUnreadPeerIds } from "@/fetchers/messages";
import {
  becomeMentor,
  connectToMentor,
  fetchMentorshipNetwork,
  fetchMentorshipSuggestions,
} from "@/fetchers/mentorship";

function UnreadBellBadge() {
  return (
    <span
      className="relative inline-flex shrink-0 text-amber-500"
      title="Unread messages"
      aria-label="Unread messages"
    >
      <Bell className="w-4 h-4" strokeWidth={2} />
      <span
        className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500 ring-2 ring-white"
        aria-hidden
      />
    </span>
  );
}

export function MentorshipPage() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  /** Internal routing only — never displayed in the UI */
  const [chatPeer, setChatPeer] = useState<{ id: string; name: string } | null>(null);

  const { data: network } = useQuery({
    queryKey: ["mentorship-network"],
    queryFn: fetchMentorshipNetwork,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["mentorship-suggestions"],
    queryFn: fetchMentorshipSuggestions,
  });

  const { data: unreadPeers } = useQuery({
    queryKey: ["messages-unread-peers"],
    queryFn: fetchUnreadPeerIds,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const unreadSet = new Set(unreadPeers?.peerIds ?? []);
  /** Unread from API, but hide bell while that thread is open — messages are treated as read in view. */
  const showUnreadBellFor = (peerId: string) =>
    chatPeer?.id !== peerId && unreadSet.has(peerId);

  useEffect(() => {
    if (!chatPeer) {
      void qc.invalidateQueries({ queryKey: ["messages-unread-peers"] });
    }
  }, [chatPeer, qc]);

  const becomeMut = useMutation({
    mutationFn: becomeMentor,
    onSuccess: async () => {
      toast.success("You're now a mentor!");
      await qc.invalidateQueries({ queryKey: ["mentorship-network"] });
      await refreshProfile();
    },
    onError: () => toast.error("Could not enable mentor mode"),
  });

  const connectMut = useMutation({
    mutationFn: connectToMentor,
    onSuccess: async () => {
      toast.success("Connected to mentor");
      await qc.invalidateQueries({ queryKey: ["mentorship-network"] });
      await qc.invalidateQueries({ queryKey: ["mentorship-suggestions"] });
      await refreshProfile();
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || "Could not connect");
    },
  });

  const credits = user?.messageCredits ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <HeartHandshake className="w-8 h-8 text-indigo-600" />
          Mentorship
        </h1>
        <p className="text-slate-500 font-medium">
          Level 5+ learners can mentor. Mentors and mentees message freely; everyone else uses the +2 level rule with
          message credits.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          <span className="bg-slate-100 px-3 py-1 rounded-full">Credits: {credits}</span>
          {network?.isMentor && (
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">Mentor mode on</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Your network
          </h2>
          {network?.canBecomeMentor && !network.isMentor && (
            <button
              type="button"
              onClick={() => becomeMut.mutate()}
              disabled={becomeMut.isPending}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              Become a mentor (Level 5+)
            </button>
          )}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">My mentor</p>
            {network?.myMentor ? (
              <div className="rounded-2xl border border-slate-100 p-4 flex flex-col gap-3">
                <div>
                  <p className="font-bold text-slate-900">{network.myMentor.name}</p>
                  <p className="text-sm text-slate-500">
                    L{network.myMentor.level} · {network.myMentor.levelName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {showUnreadBellFor(network.myMentor.userId) && <UnreadBellBadge />}
                  <button
                    type="button"
                    className="text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg w-fit"
                    onClick={() =>
                      setChatPeer({ id: network.myMentor!.userId, name: network.myMentor!.name })
                    }
                  >
                    Open chat
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No mentor yet — pick one from suggestions.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">My mentees</p>
            {network?.myMentees?.length ? (
              <ul className="space-y-2">
                {network.myMentees.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {showUnreadBellFor(m.userId) && <UnreadBellBadge />}
                      <button
                        type="button"
                        className="text-xs font-bold text-indigo-600"
                        onClick={() => setChatPeer({ id: m.userId, name: m.name })}
                      >
                        Chat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">No mentees yet.</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-4">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">Suggested mentors</h2>
          <p className="text-sm text-slate-500">
            Ranked by level fit (prefers mentors 1–2 levels above you with open slots).
          </p>
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {suggestions?.suggestions?.map((m) => {
              const isMyMentor = network?.myMentor?.userId === m.userId;
              return (
              <li
                key={m.userId}
                className="rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    L{m.level} · {m.levelName} · {m.openSlots} slots open
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isMyMentor ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                      Your mentor
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectMut.mutate(m.userId)}
                      disabled={connectMut.isPending || m.openSlots === 0}
                      className="text-xs font-black bg-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-40"
                    >
                      Connect
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {showUnreadBellFor(m.userId) && <UnreadBellBadge />}
                    <button
                      type="button"
                      onClick={() => setChatPeer({ id: m.userId, name: m.name })}
                      className="text-xs font-black border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </li>
            );
            })}
            {!suggestions?.suggestions?.length && (
              <li className="text-slate-400 text-sm">No mentors available right now.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">Messages</h2>
        </div>
        <p className="text-sm text-slate-500">
          Mentor ↔ mentee: unlimited. Otherwise you need credits (earn +1 per lesson or quiz) and the recipient must be
          at your level up to two levels above. Pick someone from your network — no IDs shown here.
        </p>

        {chatPeer ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setChatPeer(null)}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to network
            </button>
            <MentorshipChatPanel
              peerUserId={chatPeer.id}
              peerDisplayName={chatPeer.name}
              onCreditsUpdate={() => refreshProfile()}
            />
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-slate-500 text-sm font-medium">
            Choose <span className="text-slate-800 font-bold">Open chat</span> or{" "}
            <span className="text-slate-800 font-bold">Message</span> next to someone in your network.
          </div>
        )}
      </section>
    </div>
  );
}

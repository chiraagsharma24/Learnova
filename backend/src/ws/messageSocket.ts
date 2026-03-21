import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";

import type { PublicMessage } from "../lib/sendMessageCore.js";
import { validateAndSendMessage } from "../lib/sendMessageCore.js";
import { UserProfile } from "../models/UserProfile.js";

/** One-time tokens for WS handshake (HTTP cookies are not always sent on cross-origin WebSocket). */
const wsTokens = new Map<string, { userId: string; exp: number }>();
const TOKEN_TTL_MS = 5 * 60 * 1000;

export function issueWsToken(userId: string): string {
	const token = randomUUID();
	wsTokens.set(token, { userId, exp: Date.now() + TOKEN_TTL_MS });
	return token;
}

function consumeWsToken(token: string | null): string | null {
	if (!token) return null;
	const row = wsTokens.get(token);
	if (!row || row.exp < Date.now()) {
		wsTokens.delete(token);
		return null;
	}
	wsTokens.delete(token);
	return row.userId;
}

const userSockets = new Map<string, Set<WebSocket>>();

function addSocket(userId: string, ws: WebSocket) {
	let set = userSockets.get(userId);
	if (!set) {
		set = new Set();
		userSockets.set(userId, set);
	}
	set.add(ws);
}

function removeSocket(userId: string, ws: WebSocket) {
	const set = userSockets.get(userId);
	if (!set) return;
	set.delete(ws);
	if (set.size === 0) userSockets.delete(userId);
}

function broadcastToUser(userId: string, payload: object) {
	const json = JSON.stringify(payload);
	const set = userSockets.get(userId);
	if (!set) return;
	for (const ws of set) {
		if (ws.readyState === 1) ws.send(json);
	}
}

/** Realtime push to recipient only (sender gets HTTP/WS ack separately). */
export function broadcastIncomingMessageForRecipient(
	fromUserId: string,
	toUserId: string,
	publicMsg: PublicMessage,
) {
	const forRecipient: PublicMessage = {
		...publicMsg,
		isMine: false,
	};
	broadcastToUser(toUserId, {
		type: "new_message",
		/** Other participant in this DM (for client routing; do not render as text). */
		peerUserId: fromUserId,
		message: forRecipient,
	});
}

export function attachMessageSocket(server: Server) {
	const wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", (request, socket, head) => {
		const host = request.headers.host || "localhost";
		let pathname = "/";
		try {
			pathname = new URL(request.url || "/", `http://${host}`).pathname;
		} catch {
			socket.destroy();
			return;
		}
		if (pathname !== "/ws/messages") return;

		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request);
		});
	});

	wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
		void (async () => {
		const host = req.headers.host || "localhost";
		let token: string | null = null;
		try {
			const u = new URL(req.url || "/", `http://${host}`);
			token = u.searchParams.get("token");
		} catch {
			ws.close(4000, "Bad request");
			return;
		}

		const userId = consumeWsToken(token);
		if (!userId) {
			ws.send(JSON.stringify({ type: "error", error: "Invalid or expired token" }));
			ws.close(4401, "Unauthorized");
			return;
		}

		const profile = await UserProfile.findOne({ userId }).lean();
		const role = profile?.role ?? "learner";
		if (role !== "learner") {
			ws.send(JSON.stringify({ type: "error", error: "Forbidden" }));
			ws.close(4403, "Forbidden");
			return;
		}

		addSocket(userId, ws);
		ws.send(JSON.stringify({ type: "connected" }));

		ws.on("message", async (raw) => {
			try {
				const data = JSON.parse(String(raw)) as {
					type?: string;
					toUserId?: string;
					body?: string;
				};
				if (data.type !== "send" || !data.toUserId || typeof data.body !== "string") {
					ws.send(
						JSON.stringify({
							type: "error",
							error: "Expected { type: 'send', toUserId, body }",
						}),
					);
					return;
				}

				const result = await validateAndSendMessage({
					senderUserId: userId,
					toUserId: data.toUserId,
					body: data.body,
				});

				if (!result.ok) {
					ws.send(JSON.stringify({ type: "error", error: result.error }));
					return;
				}

				broadcastIncomingMessageForRecipient(userId, data.toUserId, result.public);

				ws.send(
					JSON.stringify({
						type: "sent",
						message: result.public,
						messageCredits: result.messageCredits,
						usedCredit: result.usedCredit,
					}),
				);
			} catch (e) {
				ws.send(
					JSON.stringify({
						type: "error",
						error: e instanceof Error ? e.message : "Send failed",
					}),
				);
			}
		});

		ws.on("close", () => removeSocket(userId, ws));
		})();
	});
}

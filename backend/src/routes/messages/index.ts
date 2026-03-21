import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	getUnreadFromPeerIds,
	markThreadReadForViewer,
} from "../../lib/messageRead.js";
import {
	isMentorshipLinked,
	isPlusTwoLevelEligible,
} from "../../lib/mentorshipMessaging.js";
import {
	enrichMessagesForViewer,
	validateAndSendMessage,
} from "../../lib/sendMessageCore.js";
import {
	broadcastIncomingMessageForRecipient,
	issueWsToken,
} from "../../ws/messageSocket.js";
import { type AuthRequest, requireAuth, requireRole } from "../../middlewares/auth.js";
import { Message } from "../../models/Message.js";
import { UserProfile } from "../../models/UserProfile.js";

const router = Router();

// GET /api/messages/unread-peers — peer userIds with at least one unread incoming message
router.get("/unread-peers", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const me = req.user!.id;
		const peerIds = await getUnreadFromPeerIds(me);
		return success(res, 200, { peerIds });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// POST /api/messages/mark-read { peerUserId } — mark incoming messages from peer as read
router.post("/mark-read", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const { peerUserId } = req.body as { peerUserId?: string };
		if (!peerUserId || typeof peerUserId !== "string") {
			return failure(res, 400, "peerUserId required");
		}
		const ok = await markThreadReadForViewer(req.user!.id, peerUserId);
		if (!ok) return failure(res, 403, "Not allowed");
		return success(res, 200, { ok: true });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/messages/ws-token — one-time token for WebSocket handshake
router.get("/ws-token", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const token = issueWsToken(req.user!.id);
		return success(res, 200, { token, expiresInSeconds: 300 });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// POST /api/messages  { toUserId, body }
router.post("/", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const { toUserId, body } = req.body as {
			toUserId?: string;
			body?: string;
		};
		if (!toUserId || typeof body !== "string" || !body.trim()) {
			return failure(res, 400, "toUserId and body required");
		}

		const result = await validateAndSendMessage({
			senderUserId: req.user!.id,
			toUserId,
			body,
		});

		if (!result.ok) {
			return failure(res, result.status, result.error);
		}

		broadcastIncomingMessageForRecipient(req.user!.id, toUserId, result.public);

		return success(res, 201, {
			message: result.public,
			messageCredits: result.messageCredits,
			usedCredit: result.usedCredit,
		});
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/messages/with/:peerUserId — enriched thread (no raw ids in message payloads for UI)
router.get(
	"/with/:peerUserId",
	requireAuth,
	requireRole("learner"),
	async (req: AuthRequest, res) => {
		try {
			const peerId = req.params.peerUserId;
			const me = req.user!.id;

			const [sender, target] = await Promise.all([
				UserProfile.findOne({ userId: me }),
				UserProfile.findOne({ userId: peerId }),
			]);
			if (!sender || !target) return failure(res, 404, "User not found");

			const linked = isMentorshipLinked(sender, target);
			const plusTwo = isPlusTwoLevelEligible(sender, target);
			if (!linked && !plusTwo) {
				return failure(res, 403, "Not allowed to view this thread");
			}

			const thread = await Message.find({
				$or: [
					{ fromUserId: me, toUserId: peerId },
					{ fromUserId: peerId, toUserId: me },
				],
			})
				.sort({ createdAt: 1 })
				.limit(200)
				.lean();

			const messages = await enrichMessagesForViewer(thread, me);

			await markThreadReadForViewer(me, peerId);

			return success(res, 200, {
				messages,
				peer: {
					displayName: target.name,
					level: target.level,
					levelName: target.levelName,
				},
			});
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// GET /api/messages/inbox
router.get("/inbox", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const me = req.user!.id;
		const recent = await Message.find({
			$or: [{ fromUserId: me }, { toUserId: me }],
		})
			.sort({ createdAt: -1 })
			.limit(80)
			.lean();

		const peerIds = new Set<string>();
		for (const m of recent) {
			peerIds.add(m.fromUserId === me ? m.toUserId : m.fromUserId);
		}

		const profiles = await UserProfile.find({
			userId: { $in: [...peerIds] },
		}).lean();
		const nameById = new Map(
			profiles.map((p) => [p.userId, p.name] as const),
		);

		const previews = [...peerIds].map((pid) => {
			const last = recent.find(
				(m) =>
					(m.fromUserId === me && m.toUserId === pid) ||
					(m.fromUserId === pid && m.toUserId === me),
			);
			return {
				peerDisplayName: nameById.get(pid) || "Member",
				lastBody: last?.body,
				lastAt: last?.createdAt,
				peerId: pid,
			};
		});

		return success(res, 200, { conversations: previews });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

export default router;

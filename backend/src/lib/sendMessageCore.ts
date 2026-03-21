import {
	isMentorshipLinked,
	isPlusTwoLevelEligible,
} from "./mentorshipMessaging.js";
import { Message } from "../models/Message.js";
import { UserProfile } from "../models/UserProfile.js";

export type PublicMessage = {
	id: string;
	body: string;
	createdAt: string;
	isMine: boolean;
	senderName: string;
};

export async function validateAndSendMessage(params: {
	senderUserId: string;
	toUserId: string;
	body: string;
}): Promise<
	| {
			ok: true;
			public: PublicMessage;
			messageCredits: number;
			usedCredit: boolean;
	  }
	| { ok: false; status: number; error: string }
> {
	const { senderUserId, toUserId, body } = params;
	const trimmed = body.trim().slice(0, 2000);
	if (!trimmed) return { ok: false, status: 400, error: "Message body required" };
	if (toUserId === senderUserId)
		return { ok: false, status: 400, error: "Cannot message yourself" };

	const [sender, target] = await Promise.all([
		UserProfile.findOne({ userId: senderUserId }),
		UserProfile.findOne({ userId: toUserId }),
	]);
	if (!sender || !target)
		return { ok: false, status: 404, error: "User not found" };

	const linked = isMentorshipLinked(sender, target);
	const plusTwo = isPlusTwoLevelEligible(sender, target);

	if (!linked && !plusTwo) {
		return {
			ok: false,
			status: 403,
			error:
				"You can only message your mentor/mentees or users up to 2 levels above you",
		};
	}

	let usedCredit = false;
	if (!linked) {
		const credits = sender.messageCredits ?? 0;
		if (credits < 1) {
			return {
				ok: false,
				status: 403,
				error:
					"Not enough message credits. Complete lessons or quizzes to earn more.",
			};
		}
		await UserProfile.updateOne(
			{ userId: sender.userId },
			{ $inc: { messageCredits: -1 } },
		);
		usedCredit = true;
	}

	const msg = await Message.create({
		fromUserId: sender.userId,
		toUserId: target.userId,
		body: trimmed,
	});

	const updatedSender = await UserProfile.findOne({ userId: sender.userId });

	const publicMsg: PublicMessage = {
		id: msg._id.toString(),
		body: msg.body,
		createdAt: (msg.createdAt || new Date()).toISOString(),
		isMine: true,
		senderName: sender.name,
	};

	return {
		ok: true,
		public: publicMsg,
		messageCredits: updatedSender?.messageCredits ?? 0,
		usedCredit,
	};
}

export async function enrichMessagesForViewer(
	messages: {
		_id: unknown;
		fromUserId: string;
		toUserId: string;
		body: string;
		createdAt?: Date;
	}[],
	viewerUserId: string,
): Promise<PublicMessage[]> {
	if (messages.length === 0) return [];
	const fromIds = [...new Set(messages.map((m) => m.fromUserId))];
	const profiles = await UserProfile.find({
		userId: { $in: fromIds },
	}).lean();
	const nameById = new Map(
		profiles.map((p) => [p.userId, p.name] as const),
	);
	return messages.map((m) => ({
		id: String(m._id),
		body: m.body,
		createdAt: (m.createdAt || new Date()).toISOString(),
		isMine: m.fromUserId === viewerUserId,
		senderName: nameById.get(m.fromUserId) || "Member",
	}));
}

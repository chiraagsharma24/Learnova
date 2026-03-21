import { isMentorshipLinked, isPlusTwoLevelEligible } from "./mentorshipMessaging.js";
import { Message } from "../models/Message.js";
import { UserProfile } from "../models/UserProfile.js";

export async function canViewMessageThread(
	viewerUserId: string,
	peerUserId: string,
): Promise<boolean> {
	const [viewer, peer] = await Promise.all([
		UserProfile.findOne({ userId: viewerUserId }),
		UserProfile.findOne({ userId: peerUserId }),
	]);
	if (!viewer || !peer) return false;
	return (
		isMentorshipLinked(viewer, peer) || isPlusTwoLevelEligible(viewer, peer)
	);
}

/** Mark all messages *from* peer *to* viewer as read. */
export async function markThreadReadForViewer(
	viewerUserId: string,
	peerUserId: string,
): Promise<boolean> {
	const ok = await canViewMessageThread(viewerUserId, peerUserId);
	if (!ok) return false;
	await Message.updateMany(
		{
			fromUserId: peerUserId,
			toUserId: viewerUserId,
			$or: [{ readAt: { $exists: false } }, { readAt: null }],
		},
		{ $set: { readAt: new Date() } },
	);
	return true;
}

/** Distinct peers who sent the viewer at least one unread message. */
export async function getUnreadFromPeerIds(viewerUserId: string): Promise<string[]> {
	return Message.distinct("fromUserId", {
		toUserId: viewerUserId,
		$or: [{ readAt: { $exists: false } }, { readAt: null }],
	});
}

import type { IUserProfile } from "../models/UserProfile.js";

/** Level 5+ can opt in as mentor */
export const MENTOR_MIN_LEVEL = 5;
export const DEFAULT_MENTEE_SLOTS = 5;
export const MESSAGE_CREDIT_PER_COMPLETION = 1;

export function isMentorshipLinked(a: IUserProfile, b: IUserProfile): boolean {
	const aId = a.userId;
	const bId = b.userId;
	if (a.myMentorUserId === bId || b.myMentorUserId === aId) return true;
	if ((a.menteeUserIds || []).includes(bId)) return true;
	if ((b.menteeUserIds || []).includes(aId)) return true;
	return false;
}

/**
 * +2 level rule: can message users at the same level up to 2 levels above (not below).
 */
export function isPlusTwoLevelEligible(
	sender: IUserProfile,
	target: IUserProfile,
): boolean {
	const diff = target.level - sender.level;
	return diff >= 0 && diff <= 2;
}

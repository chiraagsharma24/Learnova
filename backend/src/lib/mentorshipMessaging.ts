import type { IUserProfile } from "../models/UserProfile.js";

/** Level 5+ can opt in as mentor */
export const MENTOR_MIN_LEVEL = 5;
export const DEFAULT_MENTEE_SLOTS = 5;
export const MESSAGE_CREDIT_PER_COMPLETION = 1;

export function isMentorshipLinked(a: IUserProfile, b: IUserProfile): boolean {
	const aId = a.userId;
	const bId = b.userId;
	/** Only learner mentors count; admins/instructors may retain stale mentor flags. */
	if (a.myMentorUserId === bId && b.role === "learner") return true;
	if (b.myMentorUserId === aId && a.role === "learner") return true;
	if (a.role === "learner" && (a.menteeUserIds || []).includes(bId)) return true;
	if (b.role === "learner" && (b.menteeUserIds || []).includes(aId)) return true;
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

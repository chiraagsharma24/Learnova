import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	DEFAULT_MENTEE_SLOTS,
	MENTOR_MIN_LEVEL,
} from "../../lib/mentorshipMessaging.js";
import {
	type AuthRequest,
	requireAuth,
	requireRole,
} from "../../middlewares/auth.js";
import { UserProfile } from "../../models/UserProfile.js";

const router = Router();

function publicMentorCard(p: {
	userId: string;
	name: string;
	level: number;
	levelName: string;
	isMentor: boolean;
	menteeUserIds: string[];
	maxMenteeSlots: number;
}) {
	return {
		userId: p.userId,
		name: p.name,
		level: p.level,
		levelName: p.levelName,
		isMentor: p.isMentor,
		openSlots: Math.max(0, p.maxMenteeSlots - p.menteeUserIds.length),
	};
}

// POST /api/mentorship/become-mentor — Level 5+ learners opt in
router.post(
	"/become-mentor",
	requireAuth,
	requireRole("learner"),
	async (req: AuthRequest, res) => {
	try {
		const profile = await UserProfile.findOne({ userId: req.user!.id });
		if (!profile) return failure(res, 404, "Profile not found");
		if (profile.level < MENTOR_MIN_LEVEL) {
			return failure(
				res,
				403,
				`Reach at least level ${MENTOR_MIN_LEVEL} to become a mentor`,
			);
		}
		const updated = await UserProfile.findOneAndUpdate(
			{ userId: req.user!.id },
			{
				isMentor: true,
				maxMenteeSlots: profile.maxMenteeSlots || DEFAULT_MENTEE_SLOTS,
			},
			{ returnDocument: "after" },
		);
		if (!updated) return failure(res, 500, "Could not update mentor status");
		return success(res, 200, updated);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
	},
);

// GET /api/mentorship/suggestions — smart match: prefer mentors 1–2 levels above
router.get(
	"/suggestions",
	requireAuth,
	requireRole("learner"),
	async (req: AuthRequest, res) => {
	try {
		const me = await UserProfile.findOne({ userId: req.user!.id });
		if (!me) return failure(res, 404, "Profile not found");

		const mentors = await UserProfile.find({
			isMentor: true,
			role: "learner",
			userId: { $ne: me.userId },
		}).lean();

		const available = mentors.filter(
			(m) =>
				(m.menteeUserIds || []).length < (m.maxMenteeSlots || DEFAULT_MENTEE_SLOTS),
		);

		const scored = available.map((m) => {
			const diff = m.level - me.level;
			let score = 100 - Math.abs(diff - 1.5);
			if (diff >= 1 && diff <= 2) score += 50;
			if (m.level > me.level) score += 10;
			return { mentor: m, score };
		});

		scored.sort((a, b) => b.score - a.score);

		const list = scored.slice(0, 20).map(({ mentor: m }) =>
			publicMentorCard({
				userId: m.userId,
				name: m.name,
				level: m.level,
				levelName: m.levelName,
				isMentor: !!m.isMentor,
				menteeUserIds: m.menteeUserIds || [],
				maxMenteeSlots: m.maxMenteeSlots || DEFAULT_MENTEE_SLOTS,
			}),
		);

		return success(res, 200, { suggestions: list });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
	},
);

// GET /api/mentorship/network
router.get("/network", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const me = await UserProfile.findOne({ userId: req.user!.id });
		if (!me) return failure(res, 404, "Profile not found");

		let mentorSummary: {
			userId: string;
			name: string;
			level: number;
			levelName: string;
		} | null = null;
		if (me.myMentorUserId) {
			const m = await UserProfile.findOne({ userId: me.myMentorUserId }).lean();
			if (m && m.role === "learner") {
				mentorSummary = {
					userId: m.userId,
					name: m.name,
					level: m.level,
					levelName: m.levelName,
				};
			}
		}

		const mentees = await UserProfile.find({
			userId: { $in: me.menteeUserIds || [] },
		}).lean();

		return success(res, 200, {
			myMentor: mentorSummary,
			myMentees: mentees.map((u) => ({
				userId: u.userId,
				name: u.name,
				level: u.level,
				levelName: u.levelName,
			})),
			isMentor: me.isMentor,
			canBecomeMentor: me.level >= MENTOR_MIN_LEVEL,
		});
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// POST /api/mentorship/connect { mentorUserId }
router.post("/connect", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const { mentorUserId } = req.body as { mentorUserId?: string };
		if (!mentorUserId) return failure(res, 400, "mentorUserId required");
		if (mentorUserId === req.user!.id)
			return failure(res, 400, "Cannot connect to yourself");

		const mentee = await UserProfile.findOne({ userId: req.user!.id });
		const mentor = await UserProfile.findOne({ userId: mentorUserId });
		if (!mentee || !mentor) return failure(res, 404, "Profile not found");
		if (mentor.role !== "learner") {
			return failure(res, 400, "Only learners can be mentors");
		}
		if (!mentor.isMentor) return failure(res, 400, "User is not an active mentor");
		if (mentor.level < MENTOR_MIN_LEVEL)
			return failure(res, 400, "Mentor is not eligible");

		const slots = mentor.maxMenteeSlots || DEFAULT_MENTEE_SLOTS;
		if ((mentor.menteeUserIds || []).length >= slots) {
			return failure(res, 409, "Mentor has no open slots");
		}

		// Prefer mentee below mentor (smart pairing)
		if (mentee.level >= mentor.level) {
			return failure(
				res,
				400,
				"Choose a mentor at a higher level for the best match",
			);
		}

		const prevMentorId = mentee.myMentorUserId;
		if (prevMentorId === mentorUserId) {
			return success(res, 200, {
				alreadyConnected: true,
				mentor: {
					userId: mentor.userId,
					name: mentor.name,
					level: mentor.level,
					levelName: mentor.levelName,
				},
				mentee: {
					userId: mentee.userId,
					name: mentee.name,
					level: mentee.level,
				},
			});
		}

		if (prevMentorId) {
			await UserProfile.updateOne(
				{ userId: prevMentorId },
				{ $pull: { menteeUserIds: mentee.userId } },
			);
		}

		await UserProfile.updateOne(
			{ userId: mentee.userId },
			{ myMentorUserId: mentorUserId },
		);

		await UserProfile.updateOne(
			{ userId: mentorUserId },
			{ $addToSet: { menteeUserIds: mentee.userId } },
		);

		const updatedMentee = await UserProfile.findOne({ userId: mentee.userId });
		const updatedMentor = await UserProfile.findOne({ userId: mentorUserId });

		return success(res, 200, {
			connected: true,
			mentor: updatedMentor
				? {
						userId: updatedMentor.userId,
						name: updatedMentor.name,
						level: updatedMentor.level,
						levelName: updatedMentor.levelName,
					}
				: null,
			mentee: updatedMentee
				? {
						userId: updatedMentee.userId,
						name: updatedMentee.name,
						level: updatedMentee.level,
					}
				: null,
		});
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

export default router;

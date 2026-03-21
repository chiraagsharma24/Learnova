import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	type AuthRequest,
	requireAuth,
	requireRole,
} from "../../middlewares/auth.js";
import { Enrollment } from "../../models/Enrollment.js";
<<<<<<< HEAD
import { Lesson } from "../../models/Lesson.js";
import { LessonProgress } from "../../models/LessonProgress.js";
import { UserProfile, LESSON_COMPLETION_XP } from "../../models/UserProfile.js";
import { MESSAGE_CREDIT_PER_COMPLETION } from "../../lib/mentorshipMessaging.js";
import { recomputeProfileTotals } from "../../lib/recomputeProfileTotals.js";

const router = Router();

//  mark a lesson as complete (non-quiz) — learners only (XP / gamification)
router.post("/", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const { lessonId, courseId } = req.body;
		if (!lessonId || !courseId)
			return failure(res, 400, "lessonId and courseId required");
		const userId = req.user!.id;
=======
import { UserProfile, computeBadges } from "../../models/UserProfile.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";
import { recalculateEnrollmentProgress } from "../../utils/progress.js";

const router = Router();

// POST /api/progress - mark a lesson as complete (non-quiz)
router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { lessonId, courseId } = req.body;
        if (!lessonId || !courseId) return failure(res, 400, "lessonId and courseId required");
        const userId = req.user!.id;
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d

		const lesson = await Lesson.findById(lessonId);
		if (!lesson || lesson.type === "quiz")
			return failure(res, 400, "Use quiz attempt endpoint for quizzes");

		const prior = await LessonProgress.findOne({ userId, lessonId });
		const alreadyCompleted = prior?.completed === true;
		const previousPoints = prior?.pointsEarned ?? 0;

<<<<<<< HEAD
		// First completion: fixed XP. Repeat calls: keep existing lesson points (no double XP).
		// Legacy rows (completed with 0 XP): grant fixed XP once.
		let pointsEarned: number;
		if (alreadyCompleted) {
			pointsEarned =
				previousPoints > 0 ? previousPoints : LESSON_COMPLETION_XP;
		} else {
			pointsEarned = LESSON_COMPLETION_XP;
		}
=======
        // Update enrollment completion
        const completionPercentage = await recalculateEnrollmentProgress(userId, courseId);
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d

		const xpGainedThisRequest = Math.max(0, pointsEarned - previousPoints);

		await LessonProgress.findOneAndUpdate(
			{ userId, lessonId },
			{
				courseId,
				completed: true,
				completedAt: new Date(),
				pointsEarned,
			},
			{ upsert: true, returnDocument: "after" },
		);

		// Update enrollment completion
		const totalLessons = await Lesson.countDocuments({
			courseId,
			status: "published",
		});
		const completedLessons = await LessonProgress.countDocuments({
			userId,
			courseId,
			completed: true,
		});
		const completionPercentage =
			totalLessons > 0
				? Math.round((completedLessons / totalLessons) * 100)
				: 0;
		await Enrollment.findOneAndUpdate(
			{ userId, courseId },
			{
				completionPercentage,
				...(completionPercentage === 100
					? { completedAt: new Date() }
					: {}),
			},
			{ returnDocument: "after" },
		);

		const totalPoints = await recomputeProfileTotals(userId);
		await UserProfile.updateOne(
			{ userId },
			{ $inc: { messageCredits: MESSAGE_CREDIT_PER_COMPLETION } },
		);

		return success(res, 200, {
			completionPercentage,
			xpGainedThisRequest,
			lessonCompletionXp: LESSON_COMPLETION_XP,
			totalPoints,
		});
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/progress/course/:courseId - user's progress in a course
router.get("/course/:courseId", requireAuth, async (req: AuthRequest, res) => {
	try {
		const progress = await LessonProgress.find({
			userId: req.user!.id,
			courseId: req.params.courseId,
		});
		return success(res, 200, progress);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/progress/stats - summary of user's progress
router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        // 1. Quizzes Stats
        const progressWithQuizzes = await LessonProgress.find({
            userId,
            quizAttempts: { $gt: 0 }
        });

        const quizzesTaken = progressWithQuizzes.length;
        const totalQuizScore = progressWithQuizzes.reduce((acc, curr) => acc + (curr.quizScore || 0), 0);
        const averageScore = quizzesTaken > 0 ? Math.round(totalQuizScore / quizzesTaken) : 0;

        // 2. Course Stats
        const completedCoursesCount = await Enrollment.countDocuments({
            userId,
            completionPercentage: 100
        });

        // 3. Profile Stats (Points/Badges)
        const profile = await UserProfile.findOne({ userId });

        return success(res, 200, {
            quizzesTaken,
            averageScore: `${averageScore}%`,
            completedCoursesCount,
            totalPoints: profile?.totalPoints || 0,
            badgesCount: profile?.badges?.length || 0
        });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	type AuthRequest,
	requireAuth,
	requireRole,
} from "../../middlewares/auth.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Lesson } from "../../models/Lesson.js";
import { LessonProgress } from "../../models/LessonProgress.js";
<<<<<<< HEAD
import { Quiz } from "../../models/Quiz.js";
import { UserProfile } from "../../models/UserProfile.js";
import { MESSAGE_CREDIT_PER_COMPLETION } from "../../lib/mentorshipMessaging.js";
import { recomputeProfileTotals } from "../../lib/recomputeProfileTotals.js";
=======
import { UserProfile, computeBadges } from "../../models/UserProfile.js";
import { Enrollment } from "../../models/Enrollment.js";
import { requireAuth, requireRole, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";
import { recalculateEnrollmentProgress } from "../../utils/progress.js";
import mongoose from "mongoose";
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
	try {
		const quiz = await Quiz.findOne({ lessonId: req.params.lessonId });
		if (!quiz) return failure(res, 404, "Quiz not found");
		const sanitized = {
			...quiz.toObject(),
			questions: quiz.questions.map((q) => ({
				_id: q._id,
				question: q.question,
				choices: q.choices.map((c) => ({
					_id: (c as any)._id,
					text: c.text,
				})),
			})),
		};
		return success(res, 200, sanitized);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

//  quiz with answers
router.get(
	"/admin",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req, res) => {
		try {
			const quiz = await Quiz.findOne({ lessonId: req.params.lessonId });
			if (!quiz) return failure(res, 404, "Quiz not found");
			return success(res, 200, quiz);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

//create or update quiz
router.post(
	"/",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req: AuthRequest, res) => {
		try {
			const { questions, totalPoints, attemptRewards } = req.body;
			const { lessonId, courseId } = req.params;

			const existing = await Quiz.findOne({ lessonId });
			if (existing) {
				existing.questions = questions || existing.questions;
				existing.totalPoints = totalPoints ?? existing.totalPoints;
				existing.attemptRewards =
					attemptRewards || existing.attemptRewards;
				await existing.save();
				return success(res, 200, existing);
			}

			const quiz = await Quiz.create({
				lessonId,
				courseId,
				questions: questions || [],
				totalPoints: totalPoints || 100,
				attemptRewards: attemptRewards || [
					{ attempt: 1, pointsPercentage: 100 },
					{ attempt: 2, pointsPercentage: 50 },
					{ attempt: 3, pointsPercentage: 25 },
				],
			});
			return success(res, 201, quiz);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

//  submit quiz answers — learners only (XP / gamification)
router.post("/attempt", requireAuth, requireRole("learner"), async (req: AuthRequest, res) => {
	try {
		const { answers } = req.body;
		const { lessonId, courseId } = req.params;
		const userId = req.user!.id;

		const quiz = await Quiz.findOne({ lessonId });
		if (!quiz) return failure(res, 404, "Quiz not found");

		// Get current attempt number
		const existingProgress = await LessonProgress.findOne({
			userId,
			lessonId,
		});
		const attemptNumber = (existingProgress?.quizAttempts || 0) + 1;

		// Score the quiz
		let correctCount = 0;
		quiz.questions.forEach((q) => {
			const answer = answers.find(
				(a: any) => a.questionId === q._id!.toString(),
			);
			if (!answer) return;
			const correctChoice = q.choices.find((c) => c.isCorrect);
			const selectedChoice = q.choices[answer.choiceIndex];
			if (
				correctChoice &&
				selectedChoice &&
				correctChoice.text === selectedChoice.text
			)
				correctCount++;
		});

		const scorePercentage =
			quiz.questions.length > 0
				? Math.round((correctCount / quiz.questions.length) * 100)
				: 0;

		// Calculate points based on attempt number
		const rewardRule =
			quiz.attemptRewards.find((r) => r.attempt === attemptNumber) ||
			quiz.attemptRewards[quiz.attemptRewards.length - 1];
		const pointsMultiplier = rewardRule
			? rewardRule.pointsPercentage / 100
			: 0.1;
		const earnedPoints = Math.round(
			quiz.totalPoints * (scorePercentage / 100) * pointsMultiplier,
		);

		// Update or create lesson progress
		const progress = await LessonProgress.findOneAndUpdate(
			{ userId, lessonId },
			{
				courseId,
				quizAttempts: attemptNumber,
				quizScore: scorePercentage,
				pointsEarned: earnedPoints,
				completed: true,
				completedAt: new Date(),
			},
			{ upsert: true, returnDocument: "after" },
		);

		const totalPoints = await recomputeProfileTotals(userId);
		await UserProfile.updateOne(
			{ userId },
			{ $inc: { messageCredits: MESSAGE_CREDIT_PER_COMPLETION } },
		);

		// Update enrollment completion
		const lesson = await Lesson.findById(lessonId);
		if (lesson) {
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
		}

<<<<<<< HEAD
		return success(res, 200, {
			scorePercentage,
			correctCount,
			totalQuestions: quiz.questions.length,
			earnedPoints,
			attemptNumber,
			totalPoints,
		});
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
=======
        const badges = computeBadges(totalPoints);
        await UserProfile.findOneAndUpdate(
            { userId },
            { totalPoints, badges },
            { returnDocument: 'after' }
        );

        // Update enrollment completion
        const lesson = await Lesson.findById(lessonId);
        if (lesson) {
            await recalculateEnrollmentProgress(userId, courseId);
        }

        return success(res, 200, {
            scorePercentage,
            correctCount,
            totalQuestions: quiz.questions.length,
            earnedPoints,
            attemptNumber,
            totalPoints,
        });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d
});

export default router;

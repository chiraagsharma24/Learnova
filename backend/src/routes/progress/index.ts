import { Router } from "express";
import { LessonProgress } from "../../models/LessonProgress.js";
import { Lesson } from "../../models/Lesson.js";
import { Enrollment } from "../../models/Enrollment.js";
import { UserProfile, computeBadges } from "../../models/UserProfile.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

// POST /api/progress - mark a lesson as complete (non-quiz)
router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { lessonId, courseId } = req.body;
        if (!lessonId || !courseId) return failure(res, 400, "lessonId and courseId required");
        const userId = req.user!.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.type === "quiz") return failure(res, 400, "Use quiz attempt endpoint for quizzes");

        await LessonProgress.findOneAndUpdate(
            { userId, lessonId },
            { courseId, completed: true, completedAt: new Date(), pointsEarned: 0 },
            { upsert: true, returnDocument: 'after' }
        );

        // Update enrollment completion
        const totalLessons = await Lesson.countDocuments({ courseId, status: "published" });
        const completedLessons = await LessonProgress.countDocuments({ userId, courseId, completed: true });
        const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        await Enrollment.findOneAndUpdate(
            { userId, courseId },
            { completionPercentage, ...(completionPercentage === 100 ? { completedAt: new Date() } : {}) },
            { returnDocument: 'after' }
        );

        return success(res, 200, { completionPercentage });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// GET /api/progress/course/:courseId - user's progress in a course
router.get("/course/:courseId", requireAuth, async (req: AuthRequest, res) => {
    try {
        const progress = await LessonProgress.find({ userId: req.user!.id, courseId: req.params.courseId });
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

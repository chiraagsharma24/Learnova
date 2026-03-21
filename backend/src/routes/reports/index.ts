import { Router } from "express";
import { Enrollment } from "../../models/Enrollment.js";
import { LessonProgress } from "../../models/LessonProgress.js";
import { Lesson } from "../../models/Lesson.js";
import { UserProfile } from "../../models/UserProfile.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

// GET /api/reports/course/:courseId - completion report for a course
router.get("/course/:courseId", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollments = await Enrollment.find({ courseId });
        const totalLessons = await Lesson.countDocuments({ courseId, status: "published" });

        const report = await Promise.all(
            enrollments.map(async (e) => {
                const profile = await UserProfile.findOne({ userId: e.userId });
                const progressItems = await LessonProgress.find({ userId: e.userId, courseId });
                const completedLessons = progressItems.filter((p) => p.completed).length;
                const totalPoints = progressItems.reduce((sum, p) => sum + p.pointsEarned, 0);

                return {
                    userId: e.userId,
                    userName: profile?.name || "Unknown",
                    userEmail: profile?.email || "",
                    enrolledAt: e.enrolledAt,
                    completionPercentage: e.completionPercentage,
                    completedLessons,
                    totalLessons,
                    pointsEarned: totalPoints,
                    completedAt: e.completedAt || null,
                };
            })
        );

        return success(res, 200, {
            courseId,
            totalEnrollments: enrollments.length,
            totalLessons,
            averageCompletion: report.length > 0
                ? Math.round(report.reduce((s, r) => s + r.completionPercentage, 0) / report.length)
                : 0,
            learners: report,
        });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

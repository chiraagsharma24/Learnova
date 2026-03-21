import { Router } from "express";
import { Enrollment } from "../../models/Enrollment.js";
import { LessonProgress } from "../../models/LessonProgress.js";
import { Lesson } from "../../models/Lesson.js";
import { UserProfile, computeBadges } from "../../models/UserProfile.js";
import { requireAuth, requireRole, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

//  enroll learner in course
router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { courseId } = req.body;
        if (!courseId) return failure(res, 400, "courseId required");

        const existing = await Enrollment.findOne({ userId: req.user!.id, courseId });
        if (existing) return failure(res, 409, "Already enrolled");

        const enrollment = await Enrollment.create({ userId: req.user!.id, courseId });
        return success(res, 201, enrollment);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// learner's enrolled courses with progress
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
    try {
        const enrollments = await Enrollment.find({ userId: req.user!.id })
            .populate("courseId")
            .sort({ enrolledAt: -1 });
        return success(res, 200, enrollments);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

//  attendees list 
router.get("/course/:courseId", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ courseId: req.params.courseId }).sort({ enrolledAt: -1 });

        const withProfiles = await Promise.all(
            enrollments.map(async (e) => {
                const profile = await UserProfile.findOne({ userId: e.userId });
                return {
                    ...e.toObject(),
                    userName: profile?.name || "Unknown",
                    userEmail: profile?.email || "",
                    totalPoints: profile?.totalPoints || 0,
                };
            })
        );
        return success(res, 200, withProfiles);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// remove attendee
router.delete("/course/:courseId/user/:userId", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
    try {
        await Enrollment.findOneAndDelete({ courseId: req.params.courseId, userId: req.params.userId });
        await LessonProgress.deleteMany({ courseId: req.params.courseId, userId: req.params.userId });
        return success(res, 200, "Attendee removed");
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

//  check if current user is enrolled
router.get("/check/:courseId", requireAuth, async (req: AuthRequest, res) => {
    try {
        const enrollment = await Enrollment.findOne({ userId: req.user!.id, courseId: req.params.courseId });
        return success(res, 200, { enrolled: !!enrollment, enrollment });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

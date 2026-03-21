import { Router } from "express";
import { Lesson } from "../../models/Lesson.js";
import { Quiz } from "../../models/Quiz.js";
import { requireAuth, requireRole, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";
import { recalculateAllCourseEnrollments } from "../../utils/progress.js";

const router = Router({ mergeParams: true });

// GET /api/courses/:courseId/lessons - list lessons
router.get("/", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { status, search } = req.query;
        const query: any = { courseId };
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: "i" };

        const lessons = await Lesson.find(query).sort({ order: 1 });
        return success(res, 200, lessons);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// GET /api/courses/:courseId/lessons/:lessonId
router.get("/:lessonId", async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ _id: req.params.lessonId, courseId: req.params.courseId });
        if (!lesson) return failure(res, 404, "Lesson not found");

        if (lesson.type === "quiz") {
            const quiz = await Quiz.findOne({ lessonId: lesson._id });
            return success(res, 200, { ...lesson.toObject(), quiz });
        }
        return success(res, 200, lesson);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// POST /api/courses/:courseId/lessons - create lesson
router.post("/", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const { courseId } = req.params;
        const { title, type, status, order, videoUrl, documentUrl, imageUrl, duration } = req.body;
        if (!title || !type) return failure(res, 400, "Title and type are required");

        // Auto-order if not provided
        const lastLesson = await Lesson.findOne({ courseId }).sort({ order: -1 });
        const nextOrder = order ?? (lastLesson ? lastLesson.order + 1 : 1);

        const lesson = await Lesson.create({
            courseId,
            title,
            type,
            status: status || "draft",
            order: nextOrder,
            videoUrl,
            documentUrl,
            imageUrl,
            duration,
        });

        // Recalculate progress for all students if published
        if (lesson.status === "published") {
            await recalculateAllCourseEnrollments(courseId);
        }

        return success(res, 201, lesson);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// PUT /api/courses/:courseId/lessons/:lessonId
router.put("/:lessonId", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const lesson = await Lesson.findOneAndUpdate(
            { _id: req.params.lessonId, courseId: req.params.courseId },
            req.body,
            { returnDocument: 'after' }
        );
        if (!lesson) return failure(res, 404, "Lesson not found");

        // Recalculate progress for all students
        await recalculateAllCourseEnrollments(req.params.courseId);

        return success(res, 200, lesson);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// DELETE /api/courses/:courseId/lessons/:lessonId
router.delete("/:lessonId", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const lesson = await Lesson.findOneAndDelete({ _id: req.params.lessonId, courseId: req.params.courseId });
        if (!lesson) return failure(res, 404, "Lesson not found");
        if (lesson.type === "quiz") await Quiz.deleteOne({ lessonId: lesson._id });

        // Recalculate progress for all students
        await recalculateAllCourseEnrollments(req.params.courseId);

        return success(res, 200, "Lesson deleted");
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

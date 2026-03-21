import { Router } from "express";
import { Course } from "../../models/Course.js";
import { Lesson } from "../../models/Lesson.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Review } from "../../models/Review.js";
import { requireAuth, requireRole, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

// GET /api/courses - list courses
router.get("/", async (req, res) => {
    try {
        const search = req.query.search as string;
        const query: any = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        const courses = await Course.find({ ...query, active: true }).sort({ createdAt: -1 });

        // Attach stats
        const withStats = await Promise.all(
            courses.map(async (c) => {
                const learnerCount = await Enrollment.countDocuments({ courseId: c._id });
                const reviewCount = await Review.countDocuments({ courseId: c._id, approved: true });
                const obj = c.toObject() as any;
                obj.learnerCount = learnerCount;
                obj.reviewCount = reviewCount;
                return obj;
            })
        );
        return success(res, 200, withStats);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// GET /api/courses/admin - all courses including inactive (instructor/admin)
router.get("/admin", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const query: any = {};
        if (req.user!.role === "instructor") query.instructorId = req.user!.id;

        const courses = await Course.find(query).sort({ createdAt: -1 });
        const withStats = await Promise.all(
            courses.map(async (c) => {
                const learnerCount = await Enrollment.countDocuments({ courseId: c._id });
                const reviewCount = await Review.countDocuments({ courseId: c._id });
                const obj = c.toObject() as any;
                obj.learnerCount = learnerCount;
                obj.reviewCount = reviewCount;
                return obj;
            })
        );
        return success(res, 200, withStats);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// GET /api/courses/:id
router.get("/:id", async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return failure(res, 404, "Course not found");

        const lessons = await Lesson.find({ courseId: course._id, status: "published" }).sort({ order: 1 });
        const learnerCount = await Enrollment.countDocuments({ courseId: course._id });
        const reviews = await Review.find({ courseId: course._id, approved: true }).sort({ createdAt: -1 });

        return success(res, 200, {
            ...course.toObject(),
            lessons,
            learnerCount,
            reviews,
        });
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// POST /api/courses - create
router.post("/", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const { title, image, description, visibility, access } = req.body;
        if (!title) return failure(res, 400, "Title is required");

        const course = await Course.create({
            title,
            image: image || "",
            description: description || "",
            visibility: visibility || "everyone",
            access: access || "open",
            instructorId: req.user!.id,
            instructorName: req.user!.name,
        });
        return success(res, 201, course);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// PUT /api/courses/:id - update
router.put("/:id", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return failure(res, 404, "Course not found");
        if (req.user!.role === "instructor" && course.instructorId !== req.user!.id) {
            return failure(res, 403, "Forbidden");
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        return success(res, 200, updated!);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// DELETE /api/courses/:id
router.delete("/:id", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return failure(res, 404, "Course not found");
        if (req.user!.role === "instructor" && course.instructorId !== req.user!.id) {
            return failure(res, 403, "Forbidden");
        }

        await Course.findByIdAndDelete(req.params.id);
        await Lesson.deleteMany({ courseId: req.params.id });
        return success(res, 200, "Course deleted");
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

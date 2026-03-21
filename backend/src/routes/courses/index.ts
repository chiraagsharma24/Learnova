import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	type AuthRequest,
	requireAuth,
	requireRole,
} from "../../middlewares/auth.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Lesson } from "../../models/Lesson.js";
import { Review } from "../../models/Review.js";

const router = Router();

async function attachLessonAggregates(courseDocs: { _id: unknown }[]) {
	if (courseDocs.length === 0) return new Map<string, { lessonCount: number; totalDurationMinutes: number }>();
	const ids = courseDocs.map((c) => c._id);
	const rows = await Lesson.aggregate<{
		_id: unknown;
		lessonCount: number;
		totalDurationMinutes: number;
	}>([
		{ $match: { courseId: { $in: ids } } },
		{
			$group: {
				_id: "$courseId",
				lessonCount: { $sum: 1 },
				totalDurationMinutes: {
					$sum: {
						$cond: [
							{ $eq: ["$type", "video"] },
							{ $ifNull: ["$duration", 0] },
							0,
						],
					},
				},
			},
		},
	]);
	return new Map(
		rows.map((r) => [
			String(r._id),
			{
				lessonCount: r.lessonCount,
				totalDurationMinutes: Math.round(r.totalDurationMinutes * 100) / 100,
			},
		]),
	);
}

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
		const courses = await Course.find({ ...query, active: true }).sort({
			createdAt: -1,
		});

		// Attach stats
		const withStats = await Promise.all(
			courses.map(async (c) => {
				const learnerCount = await Enrollment.countDocuments({
					courseId: c._id,
				});
				const reviewCount = await Review.countDocuments({
					courseId: c._id,
					approved: true,
				});
				const obj = c.toObject() as any;
				obj.learnerCount = learnerCount;
				obj.reviewCount = reviewCount;
				return obj;
			}),
		);
		return success(res, 200, withStats);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/courses/admin - all courses including inactive (instructor/admin)
router.get(
	"/admin",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req: AuthRequest, res) => {
		try {
			const query: any = {};
			if (req.user!.role === "instructor")
				query.instructorId = req.user!.id;

			const search = (req.query.search as string)?.trim();
			if (search) {
				query.title = { $regex: search, $options: "i" };
			}

			const courses = await Course.find(query).sort({ createdAt: -1 });
			const lessonMap = await attachLessonAggregates(courses);
			const withStats = await Promise.all(
				courses.map(async (c) => {
					const learnerCount = await Enrollment.countDocuments({
						courseId: c._id,
					});
					const reviewCount = await Review.countDocuments({
						courseId: c._id,
					});
					const agg = lessonMap.get(String(c._id));
					const obj = c.toObject() as any;
					obj.learnerCount = learnerCount;
					obj.reviewCount = reviewCount;
					obj.lessonCount = agg?.lessonCount ?? 0;
					obj.totalDurationMinutes = agg?.totalDurationMinutes ?? 0;
					return obj;
				}),
			);
			return success(res, 200, withStats);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// POST /api/courses/:id/view — public course page view (count at most once per browser session client-side)
router.post("/:id/view", async (req, res) => {
	try {
		const course = await Course.findById(req.params.id);
		if (!course) return failure(res, 404, "Course not found");
		if (!course.active) return success(res, 200, { counted: false });

		await Course.findByIdAndUpdate(req.params.id, {
			$inc: { viewCount: 1 },
		});
		return success(res, 200, { counted: true });
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/courses/:id
router.get("/:id", async (req, res) => {
	try {
		const course = await Course.findById(req.params.id);
		if (!course) return failure(res, 404, "Course not found");

		const lessons = await Lesson.find({
			courseId: course._id,
			status: "published",
		}).sort({ order: 1 });
		const learnerCount = await Enrollment.countDocuments({
			courseId: course._id,
		});
		const reviews = await Review.find({
			courseId: course._id,
			approved: true,
		}).sort({ createdAt: -1 });

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

// POST /api/courses - create (instructors only; admin manages catalog via dashboard, not as author)
router.post(
	"/",
	requireAuth,
	requireRole("instructor"),
	async (req: AuthRequest, res) => {
		try {
			const {
				title,
				image,
				description,
				visibility,
				access,
				tags,
				active,
				websiteUrl,
				courseAdminUserId,
				price,
			} = req.body;
			if (!title) return failure(res, 400, "Title is required");

			const tagList = Array.isArray(tags)
				? tags.filter((t: unknown) => typeof t === "string").map((t: string) => t.trim()).filter(Boolean)
				: [];

			const accessVal =
				access === "open" || access === "invitation" || access === "payment"
					? access
					: "open";

			const course = await Course.create({
				title,
				image: image || "",
				description: description || "",
				visibility: visibility || "everyone",
				access: accessVal,
				websiteUrl: typeof websiteUrl === "string" ? websiteUrl.trim() : "",
				courseAdminUserId:
					typeof courseAdminUserId === "string" ? courseAdminUserId.trim() : "",
				price: typeof price === "number" && price >= 0 ? price : 0,
				tags: tagList,
				active: typeof active === "boolean" ? active : true,
				instructorId: req.user!.id,
				instructorName: req.user!.name,
			});
			return success(res, 201, course);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// PUT /api/courses/:id - update
router.put(
	"/:id",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req: AuthRequest, res) => {
		try {
			const course = await Course.findById(req.params.id);
			if (!course) return failure(res, 404, "Course not found");
			if (
				req.user!.role === "instructor" &&
				course.instructorId !== req.user!.id
			) {
				return failure(res, 403, "Forbidden");
			}

			const body = { ...req.body } as Record<string, unknown>;
			if (body.tags !== undefined) {
				body.tags = Array.isArray(body.tags)
					? body.tags
							.filter((t: unknown) => typeof t === "string")
							.map((t: string) => t.trim())
							.filter(Boolean)
					: [];
			}

			const updated = await Course.findByIdAndUpdate(
				req.params.id,
				body,
				{ returnDocument: "after" },
			);
			return success(res, 200, updated!);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// DELETE /api/courses/:id
router.delete(
	"/:id",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req: AuthRequest, res) => {
		try {
			const course = await Course.findById(req.params.id);
			if (!course) return failure(res, 404, "Course not found");
			if (
				req.user!.role === "instructor" &&
				course.instructorId !== req.user!.id
			) {
				return failure(res, 403, "Forbidden");
			}

			await Course.findByIdAndDelete(req.params.id);
			await Lesson.deleteMany({ courseId: req.params.id });
			return success(res, 200, "Course deleted");
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

export default router;

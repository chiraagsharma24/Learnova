import { Router } from "express";
import { failure, success } from "../../config/response.js";
import {
	type AuthRequest,
	requireAuth,
	requireRole,
} from "../../middlewares/auth.js";
import { Review } from "../../models/Review.js";

const router = Router();

// POST /api/reviews - submit review
router.post("/", requireAuth, async (req: AuthRequest, res) => {
	try {
		const { courseId, rating, comment } = req.body;
		if (!courseId || !rating || !comment)
			return failure(res, 400, "courseId, rating, and comment required");

		const existing = await Review.findOne({
			userId: req.user!.id,
			courseId,
		});
		if (existing) return failure(res, 409, "Already reviewed this course");

		const review = await Review.create({
			userId: req.user!.id,
			userName: req.user!.name,
			courseId,
			rating,
			comment,
			approved: false,
		});
		return success(res, 201, review);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/reviews/course/:courseId - get approved reviews
router.get("/course/:courseId", async (req, res) => {
	try {
		const reviews = await Review.find({
			courseId: req.params.courseId,
			approved: true,
		}).sort({ createdAt: -1 });
		return success(res, 200, reviews);
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
});

// GET /api/reviews/course/:courseId/all - all reviews (instructor/admin)
router.get(
	"/course/:courseId/all",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req, res) => {
		try {
			const reviews = await Review.find({
				courseId: req.params.courseId,
			}).sort({ createdAt: -1 });
			return success(res, 200, reviews);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// PUT /api/reviews/:id/approve
router.put(
	"/:id/approve",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req, res) => {
		try {
			const review = await Review.findByIdAndUpdate(
				req.params.id,
				{ approved: true },
				{ returnDocument: "after" },
			);
			if (!review) return failure(res, 404, "Review not found");
			return success(res, 200, review);
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

// DELETE /api/reviews/:id
router.delete(
	"/:id",
	requireAuth,
	requireRole("admin", "instructor"),
	async (req, res) => {
		try {
			await Review.findByIdAndDelete(req.params.id);
			return success(res, 200, "Review deleted");
		} catch (err) {
			return failure(res, 500, `${err}`);
		}
	},
);

export default router;

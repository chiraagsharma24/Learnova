import { type Response, Router } from "express";

import { asyncHandler } from "../../config/handler.js";
import { success } from "../../config/response.js";
import { type AuthRequest, requireAuth } from "../../middlewares/auth.js";
import { getFeed } from "./controller.js";

const router = Router();

router.get(
	"/",
	requireAuth,
	asyncHandler(async (req: AuthRequest, res: Response) => {
		const session = req.authSession!;
		const userId = session.user.id;

		const feed = await getFeed(userId);

		console.log(`/feed  ${session.user.name}`);
		return success(res, 200, feed);
	}),
);

export default router;

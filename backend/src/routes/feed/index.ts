import { Router, type Response } from "express";

import { asyncHandler } from "../../config/handler.js";
import { success } from "../../config/response.js";
import { getFeed } from "./controller.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";

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

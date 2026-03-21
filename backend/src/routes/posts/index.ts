import { Router } from "express";
import type { Response } from "express";

import { asyncHandler } from "../../config/handler.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";
import { failure, success } from "../../config/response.js";
import { getPost } from "./controller.js";

const router = Router();

router.get(
  "/:postId",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.params;

    const postFound = await getPost(userId, postId);
    if (!postFound) return failure(res, 404, "Post not found!");

    return success(res, 200, postFound);
  }),
);

export default router;

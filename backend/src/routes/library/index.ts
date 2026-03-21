import { Router } from "express";
import type { Response } from "express";

import { asyncHandler } from "../../config/handler.js";
import { failure, success } from "../../config/response.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";
import { getYourLists, getPosts } from "./controller.js";
import type { PostType } from "../../types/post.js";

const router = Router();

router.get(
  "/your-lists",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const yourLists = await getYourLists(userId);

    if (!yourLists) return failure(res, 404, "Your lists not found");
    return success(res, 200, yourLists);
  }),
);

router.get(
  "/posts/:postType",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;
    const { postType } = req.params;

    const postsFound = await getPosts(userId, postType as PostType);

    // if (!postsFound) return failure(res, 404, "Posts not found!");
    return success(res, 200, postsFound);
  }),
);

export default router;

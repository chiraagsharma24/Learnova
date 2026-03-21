import { Router } from "express";
import type { Response } from "express";

import { asyncHandler } from "../../config/handler.js";
import { failure, success } from "../../config/response.js";
import { getMyLists, createMyList } from "./controllers/my-lists.js";
import { AuthRequest, requireAuth } from "../../middlewares/auth.js";

const router = Router();

router.get(
  "/my-lists",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const myLists = await getMyLists(userId);

    if (!myLists) return failure(res, 404, "My lists not found!");
    return success(res, 200, myLists);
  }),
);

router.post(
  "/my-lists",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { title, desc } = req.body;

    const listCreated = await createMyList(userId, title, desc ?? null);

    if (!listCreated) return failure(res, 300, "Failed to create list");
    return success(res, 201, listCreated);
  }),
);

export default router;

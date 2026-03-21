import { Router, type Response } from "express";

import { asyncHandler } from "../../config/handler.js";
import { failure, success } from "../../config/response.js";
import { createBookmark, deleteBookmark, getBookmarks } from "./controller.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const bookmarksFound = await getBookmarks(userId);
    if (!bookmarksFound) return failure(res, 404, "Error to fetch bookmarks");

    console.log(`GET /bookmarks all bookmarks`);
    return success(res, 200, bookmarksFound);
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.body;

    const bookmarkCreated = await createBookmark(userId, postId);
    if (!bookmarkCreated) return failure(res, 404, "Error to create bookmark");

    console.log(`POST /bookmarks new bookmark (${postId})`);
    return success(res, 201, "Bookmarked successfully");
  }),
);

router.delete(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.body;

    const bookmarkDeleted = await deleteBookmark(userId, postId);
    if (!bookmarkDeleted) return failure(res, 404, "Bookmark not found!");

    console.log(`DELETE /bookmarks (${postId})`);
    return success(res, 200, "Bookmark deleted successfully");
  }),
);

export default router;

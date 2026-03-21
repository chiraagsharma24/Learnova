import { type Response, Router } from "express";
import multer from "multer";

import { asyncHandler } from "../../config/handler.js";
import { failure, success } from "../../config/response.js";
import { uploadImages } from "../../config/upload.js";
import { type AuthRequest, requireAuth } from "../../middlewares/auth.js";
import { createDraft, deleteDraftImage, getPostById, publishDraft, updateDraft } from "./controller.js";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed, not ${file.mimetype}`));
    }
  },
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { title, desc } = req.body;
    const draftCreated = await createDraft(userId, title, desc);
    return success(res, 201, draftCreated);
  }),
);

router.get(
  "/:postId",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.params;

    const postFound = await getPostById(postId, userId);
    if (!postFound) {
      return failure(res, 404, "Draft not found with given id");
    }

    return success(res, 200, postFound);
  }),
);

router.put(
  "/:postId",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.params;
    const { title, desc, featuredImg, content } = req.body;

    const postUpdated = await updateDraft(userId, postId, title, desc, featuredImg, content);
    if (!postUpdated) {
      return failure(res, 404, "Draft not found with given id");
    }

    return success(res, 200, "Draft updated successfully!");
  }),
);

// Upload featured image for a draft
router.post(
  "/:postId/upload",
  requireAuth,
  upload.array("file", 10),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;
    const { postId } = req.params;
    const { featuredImg } = req.body;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return failure(res, 400, "No image files provided");
    }

    const result = await uploadImages(userId, postId, files);

    if (!result.success) {
      return failure(res, 400, result.message || "Upload failed");
    }

    if (featuredImg) await updateDraft(userId, postId, null, null, result.urls[0], null);

    return success(res, 200, { urls: result.urls });
  }),
);

// Delete featured image for a draft
router.delete(
  "/:postId/upload",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;
    const { postId } = req.params;

    const result = await deleteDraftImage(userId, postId);

    if (!result.success) {
      return failure(res, 400, result.error || "Delete failed");
    }

    return success(res, 200, "Image deleted successfully");
  }),
);

router.get(
  "/:postId/publish",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = req.authSession!;
    const userId = session.user.id;

    const { postId } = req.params;

    const draftPublished = await publishDraft(userId, postId);
    if (!draftPublished) return failure(res, 404, "Draft not found with given id");

    return success(res, 200, "Draft published successfully!");
  }),
);

export default router;

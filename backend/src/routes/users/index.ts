import { Router } from "express";
import { UserProfile } from "../../models/UserProfile.js";
import { requireAuth, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

// GET /api/users/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user!.id });
    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        role: (req.user as any).role || "learner",
        totalPoints: 0,
        badges: [],
      });
    }
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// POST /api/users/become-instructor
router.post("/become-instructor", requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user!.id },
      { role: "instructor" },
      { returnDocument: 'after', upsert: true }
    );
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// PUT /api/users/me - update profile
router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  //... (keep existing)
  try {
    const { name } = req.body;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user!.id },
      { name: name || req.user!.name },
      { returnDocument: 'after', upsert: true }
    );
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/users - list users (admin only)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const users = await UserProfile.find({}).sort({ createdAt: -1 });
    return success(res, 200, users);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

export default router;

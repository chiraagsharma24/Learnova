import { Router } from "express";
import { UserProfile } from "../../models/UserProfile.js";
import { requireAuth, requireRole, type AuthRequest } from "../../middlewares/auth.js";
import { success, failure } from "../../config/response.js";

const router = Router();

// GET /api/users/me - get current user profile
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.user!.id });
        if (!profile) return failure(res, 404, "Profile not found");
        return success(res, 200, profile);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// POST /api/users/become-instructor - submit a request to become an instructor
router.post("/become-instructor", requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const profile = await UserProfile.findOne({ userId });
        if (!profile) return failure(res, 404, "Profile not found");

        if (profile.role === "instructor" || profile.role === "admin") {
            return failure(res, 400, "Already has instructor or admin role");
        }

        if (profile.instructorRequestStatus === "pending") {
            return failure(res, 400, "Request already pending");
        }

        profile.instructorRequestStatus = "pending";
        await profile.save();

        return success(res, 200, profile);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// GET /api/users/admin/instructor-requests - (Admin only) list all pending requests
router.get("/admin/instructor-requests", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
        const requests = await UserProfile.find({ instructorRequestStatus: "pending" });
        return success(res, 200, requests);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// POST /api/users/admin/instructor-requests/:userId/approve - (Admin only) approve a request
router.post("/admin/instructor-requests/:userId/approve", requireAuth, requireRole("admin"), async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        const profile = await UserProfile.findOne({ userId });
        if (!profile) return failure(res, 404, "User not found");

        profile.role = "instructor";
        profile.instructorRequestStatus = "approved";
        await profile.save();

        return success(res, 200, profile);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

// POST /api/users/admin/instructor-requests/:userId/reject - (Admin only) reject a request
router.post("/admin/instructor-requests/:userId/reject", requireAuth, requireRole("admin"), async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        const profile = await UserProfile.findOne({ userId });
        if (!profile) return failure(res, 404, "User not found");

        profile.instructorRequestStatus = "rejected";
        await profile.save();

        return success(res, 200, profile);
    } catch (err) {
        return failure(res, 500, `${err}`);
    }
});

export default router;

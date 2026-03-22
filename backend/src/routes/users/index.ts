import { Router } from "express";
import { failure, success } from "../../config/response.js";
import { type AuthRequest, loadUserProfileForSession, requireAuth, requireRole } from "../../middlewares/auth.js";
import { UserProfile, updateDailyStreak } from "../../models/UserProfile.js";

function isLearnerRole(role: string | undefined): boolean {
  return (role ?? "learner") === "learner";
}

const router = Router();

// GET /api/users/me - get current user profile
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    let profile = await loadUserProfileForSession(req.user!.id, req.user!.email);
    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        role: (req.user as any).role || "learner",
        totalPoints: 0,
        level: 1,
        levelName: "The Novice",
        streakCount: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
        badges: [],
        artifacts: [],
        isMentor: false,
        maxMenteeSlots: 5,
        menteeUserIds: [],
        messageCredits: 10,
      });
    } else if (isLearnerRole(profile.role)) {
      const streakUpdated = updateDailyStreak(profile);
      if (streakUpdated) {
        await profile.save();
      }
    }
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// POST /api/users/become-instructor — submit a request to become an instructor
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

// GET /api/users/admin/instructor-requests — (Admin only) list pending requests
router.get("/admin/instructor-requests", requireAuth, requireRole("admin"), async (_req: AuthRequest, res) => {
  try {
    const requests = await UserProfile.find({
      instructorRequestStatus: "pending",
    });
    return success(res, 200, requests);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// POST /api/users/admin/instructor-requests/:userId/approve
router.post(
  "/admin/instructor-requests/:userId/approve",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
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
  },
);

// POST /api/users/admin/instructor-requests/:userId/reject
router.post(
  "/admin/instructor-requests/:userId/reject",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
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
  },
);

// PUT /api/users/me - update profile
router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  //... (keep existing)
  try {
    const { name } = req.body;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user!.id },
      { name: name || req.user!.name },
      { returnDocument: "after", upsert: true },
    );
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/users/staff-for-course-admin — instructors + admins (course responsible picker)
router.get(
  "/staff-for-course-admin",
  requireAuth,
  requireRole("admin", "instructor"),
  async (_req: AuthRequest, res) => {
    try {
      const staff = await UserProfile.find({
        role: { $in: ["instructor", "admin"] },
      })
        .select("userId name email role")
        .sort({ name: 1 })
        .lean();
      return success(res, 200, staff);
    } catch (err) {
      return failure(res, 500, `${err}`);
    }
  },
);

const ROLES = ["learner", "instructor", "admin"] as const;

// GET /api/users/admin/users — list profiles (admin only)
router.get("/admin/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const role = (req.query.role as string | undefined)?.trim();
    const q: Record<string, unknown> = {};
    if (role && (ROLES as readonly string[]).includes(role)) {
      q.role = role;
    }
    const users = await UserProfile.find(q)
      .sort({ createdAt: -1 })
      .select("userId name email role blocked createdAt instructorRequestStatus")
      .lean();
    return success(res, 200, users);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// PATCH /api/users/admin/users/:userId — block/unblock or change role (admin only)
router.patch("/admin/users/:userId", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { blocked, role } = req.body as {
      blocked?: boolean;
      role?: string;
    };

    if (blocked === undefined && role === undefined) {
      return failure(res, 400, "Nothing to update");
    }

    if (role !== undefined && !(ROLES as readonly string[]).includes(role)) {
      return failure(res, 400, "Invalid role");
    }

    const profile = await UserProfile.findOne({ userId });
    if (!profile) return failure(res, 404, "User not found");

    if (userId === req.user!.id) {
      if (blocked === true) {
        return failure(res, 400, "Cannot block your own account");
      }
      if (role !== undefined && role !== "admin") {
        return failure(res, 400, "Cannot demote your own admin account");
      }
    }

    if (role !== undefined && role !== "admin" && profile.role === "admin") {
      const adminCount = await UserProfile.countDocuments({
        role: "admin",
      });
      if (adminCount <= 1) {
        return failure(res, 400, "Cannot remove the last admin");
      }
    }

    if (blocked !== undefined) profile.blocked = Boolean(blocked);
    if (role !== undefined) profile.role = role as (typeof ROLES)[number];

    if (profile.role === "admin" || profile.role === "instructor") {
      const menteeIds = [...(profile.menteeUserIds || [])];
      if (profile.isMentor || menteeIds.length > 0) {
        profile.isMentor = false;
        profile.menteeUserIds = [];
        if (menteeIds.length > 0) {
          await UserProfile.updateMany(
            { userId: { $in: menteeIds }, myMentorUserId: userId },
            { $unset: { myMentorUserId: 1 } },
          );
        }
      }
    }

    await profile.save();
    return success(res, 200, profile);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});
//     try {
//         const profile = await UserProfile.findOne({ userId: req.user!.id });
//         if (!profile) return failure(res, 404, "Profile not found");
//         return success(res, 200, profile);
//     } catch (err) {
//         return failure(res, 500, `${err}`);
//     }
// });

// // POST /api/users/become-instructor - submit a request to become an instructor
// router.post("/become-instructor", requireAuth, async (req: AuthRequest, res) => {
//     try {
//         const userId = req.user!.id;
//         const profile = await UserProfile.findOne({ userId });
//         if (!profile) return failure(res, 404, "Profile not found");

//         if (profile.role === "instructor" || profile.role === "admin") {
//             return failure(res, 400, "Already has instructor or admin role");
//         }

//         if (profile.instructorRequestStatus === "pending") {
//             return failure(res, 400, "Request already pending");
//         }

//         profile.instructorRequestStatus = "pending";
//         await profile.save();

//         return success(res, 200, profile);
//     } catch (err) {
//         return failure(res, 500, `${err}`);
//     }
// });

// // GET /api/users/admin/instructor-requests - (Admin only) list all pending requests
// router.get("/admin/instructor-requests", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
//     try {
//         const requests = await UserProfile.find({ instructorRequestStatus: "pending" });
//         return success(res, 200, requests);
//     } catch (err) {
//         return failure(res, 500, `${err}`);
//     }
// });

// // POST /api/users/admin/instructor-requests/:userId/approve - (Admin only) approve a request
// router.post("/admin/instructor-requests/:userId/approve", requireAuth, requireRole("admin"), async (req: any, res: any) => {
//     try {
//         const { userId } = req.params;
//         const profile = await UserProfile.findOne({ userId });
//         if (!profile) return failure(res, 404, "User not found");

//         profile.role = "instructor";
//         profile.instructorRequestStatus = "approved";
//         await profile.save();

//         return success(res, 200, profile);
//     } catch (err) {
//         return failure(res, 500, `${err}`);
//     }
// });

// // POST /api/users/admin/instructor-requests/:userId/reject - (Admin only) reject a request
// router.post("/admin/instructor-requests/:userId/reject", requireAuth, requireRole("admin"), async (req: any, res: any) => {
//     try {
//         const { userId } = req.params;
//         const profile = await UserProfile.findOne({ userId });
//         if (!profile) return failure(res, 404, "User not found");

//         profile.instructorRequestStatus = "rejected";
//         await profile.save();

//         return success(res, 200, profile);
//     } catch (err) {
//         return failure(res, 500, `${err}`);
//     }
// });

export default router;

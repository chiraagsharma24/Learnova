import { Router } from "express";

import { failure, success } from "../../config/response.js";
import { type AuthRequest, requireAuth, requireRole } from "../../middlewares/auth.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Lesson } from "../../models/Lesson.js";
import { LessonProgress } from "../../models/LessonProgress.js";
import { UserProfile } from "../../models/UserProfile.js";

const router = Router();

// GET /api/reports/instructor/overview — all enrollments across instructor's courses (admin: all)
router.get("/instructor/overview", requireAuth, requireRole("admin", "instructor"), async (req: AuthRequest, res) => {
  try {
    const courseQuery: Record<string, unknown> = {};
    if (req.user!.role === "instructor") {
      courseQuery.instructorId = req.user!.id;
    }

    const courses = await Course.find(courseQuery).lean();
    const courseIds = courses.map((c) => c._id);
    const courseMap = new Map(courses.map((c) => [String(c._id), c as { _id: unknown; title: string }]));

    if (courseIds.length === 0) {
      return success(res, 200, {
        overview: {
          totalParticipants: 0,
          yetToStart: 0,
          inProgress: 0,
          completed: 0,
        },
        rows: [],
      });
    }

    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
    });

    type Row = {
      enrollmentId: string;
      courseId: string;
      courseName: string;
      participantName: string;
      participantEmail: string;
      enrolledAt: Date;
      startDate: Date | null;
      timeSpentMinutes: number;
      completionPercentage: number;
      completedAt: Date | null;
      status: "yet_to_start" | "in_progress" | "completed";
    };

    const rows: Row[] = [];

    for (const e of enrollments) {
      const course = courseMap.get(String(e.courseId));
      if (!course) continue;

      const profile = await UserProfile.findOne({ userId: e.userId });
      const progressItems = await LessonProgress.find({
        userId: e.userId,
        courseId: e.courseId,
      });
      const totalPublished = await Lesson.countDocuments({
        courseId: e.courseId,
        status: "published",
      });
      const completedLessons = progressItems.filter((p) => p.completed).length;

      let startDate: Date | null = null;
      if (progressItems.length > 0) {
        const times = progressItems
          .map((p) => (p.createdAt ? new Date(p.createdAt).getTime() : 0))
          .filter((t) => t > 0);
        if (times.length > 0) startDate = new Date(Math.min(...times));
      }

      let status: Row["status"];
      if (e.completionPercentage >= 100 || e.completedAt) {
        status = "completed";
      } else if (completedLessons === 0 && totalPublished > 0) {
        status = "yet_to_start";
      } else if (totalPublished === 0) {
        status = "yet_to_start";
      } else {
        status = "in_progress";
      }

      rows.push({
        enrollmentId: String(e._id),
        courseId: String(e.courseId),
        courseName: course.title,
        participantName: profile?.name || "Unknown",
        participantEmail: profile?.email || "",
        enrolledAt: e.enrolledAt,
        startDate,
        timeSpentMinutes: 0,
        completionPercentage: e.completionPercentage,
        completedAt: e.completedAt || null,
        status,
      });
    }

    const totalParticipants = rows.length;
    const yetToStart = rows.filter((r) => r.status === "yet_to_start").length;
    const inProgress = rows.filter((r) => r.status === "in_progress").length;
    const completed = rows.filter((r) => r.status === "completed").length;

    return success(res, 200, {
      overview: {
        totalParticipants,
        yetToStart,
        inProgress,
        completed,
      },
      rows,
    });
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/reports/course/:courseId - completion report for a course
router.get("/course/:courseId", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollments = await Enrollment.find({ courseId });
    const totalLessons = await Lesson.countDocuments({
      courseId,
      status: "published",
    });

    const report = await Promise.all(
      enrollments.map(async (e) => {
        const profile = await UserProfile.findOne({
          userId: e.userId,
        });
        const progressItems = await LessonProgress.find({
          userId: e.userId,
          courseId,
        });
        const completedLessons = progressItems.filter((p) => p.completed).length;
        const totalPoints = progressItems.reduce((sum, p) => sum + p.pointsEarned, 0);

        return {
          userId: e.userId,
          userName: profile?.name || "Unknown",
          userEmail: profile?.email || "",
          enrolledAt: e.enrolledAt,
          completionPercentage: e.completionPercentage,
          completedLessons,
          totalLessons,
          pointsEarned: totalPoints,
          completedAt: e.completedAt || null,
        };
      }),
    );

    return success(res, 200, {
      courseId,
      totalEnrollments: enrollments.length,
      totalLessons,
      averageCompletion:
        report.length > 0 ? Math.round(report.reduce((s, r) => s + r.completionPercentage, 0) / report.length) : 0,
      learners: report,
    });
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/reports/admin/stats — (Admin only) system-wide stats
router.get("/admin/stats", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalUsers = await UserProfile.countDocuments();
    const totalStudents = await UserProfile.countDocuments({
      role: "learner",
    });
    const totalInstructors = await UserProfile.countDocuments({
      role: "instructor",
    });
    const activeLearners = await UserProfile.countDocuments({
      role: "learner",
      blocked: { $ne: true },
    });
    const activeInstructors = await UserProfile.countDocuments({
      role: "instructor",
      blocked: { $ne: true },
    });
    const totalEnrollments = await Enrollment.countDocuments();

    const latestCourses = await Course.find().sort({ createdAt: -1 }).limit(5);

    const latestEnrollments = await Enrollment.find().populate("courseId").sort({ enrolledAt: -1 }).limit(5);

    const enrollmentActivity = await Promise.all(
      latestEnrollments.map(async (e) => {
        const profile = await UserProfile.findOne({
          userId: e.userId,
        });
        return {
          courseTitle: (e.courseId as { title?: string })?.title || "Unknown Course",
          studentName: profile?.name || "Unknown Student",
          enrolledAt: e.enrolledAt,
        };
      }),
    );

    return success(res, 200, {
      totalUsers,
      totalCourses,
      totalStudents,
      totalInstructors,
      activeLearners,
      activeInstructors,
      totalEnrollments,
      latestCourses,
      enrollmentActivity,
    });
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/reports/admin/course-performance — views, enrollments, completion (admin only)
router.get("/admin/course-performance", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const enrollmentsColl = Enrollment.collection.name;
    const lessonsColl = Lesson.collection.name;

    const rows = await Course.aggregate<{
      _id: unknown;
      title: string;
      instructorName: string;
      active: boolean;
      viewCount: number;
      lessonCount: number;
      enrollmentCount: number;
      avgCompletion: number;
    }>([
      {
        $lookup: {
          from: enrollmentsColl,
          localField: "_id",
          foreignField: "courseId",
          as: "enrollments",
        },
      },
      {
        $lookup: {
          from: lessonsColl,
          localField: "_id",
          foreignField: "courseId",
          as: "lessons",
        },
      },
      {
        $project: {
          title: 1,
          instructorName: 1,
          active: 1,
          viewCount: { $ifNull: ["$viewCount", 0] },
          lessonCount: { $size: "$lessons" },
          enrollmentCount: { $size: "$enrollments" },
          avgCompletion: {
            $cond: [{ $gt: [{ $size: "$enrollments" }, 0] }, { $avg: "$enrollments.completionPercentage" }, 0],
          },
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: 100 },
    ]);

    const normalized = rows.map((r) => ({
      courseId: String(r._id),
      title: r.title,
      instructorName: r.instructorName,
      active: r.active,
      viewCount: r.viewCount,
      lessonCount: r.lessonCount,
      enrollmentCount: r.enrollmentCount,
      avgCompletion: Math.round(Number(r.avgCompletion) || 0),
    }));

    return success(res, 200, normalized);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

// GET /api/reports/admin/stats - (Admin only) system-wide stats
router.get("/admin/stats", requireAuth, requireRole("admin"), async (req: any, res: any) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalStudents = await UserProfile.countDocuments({ role: "learner" });
    const totalInstructors = await UserProfile.countDocuments({ role: "instructor" });
    const totalEnrollments = await Enrollment.countDocuments();

    console.log(
      `[AdminStats] Courses: ${totalCourses}, Students: ${totalStudents}, Instructors: ${totalInstructors}, Enrollments: ${totalEnrollments}`,
    );

    // Latest courses
    const latestCourses = await Course.find().sort({ createdAt: -1 }).limit(5);

    // Latest enrollment activity
    const latestEnrollments = await Enrollment.find().populate("courseId").sort({ enrolledAt: -1 }).limit(5);

    const enrollmentActivity = await Promise.all(
      latestEnrollments.map(async (e) => {
        const profile = await UserProfile.findOne({ userId: e.userId });
        return {
          courseTitle: (e.courseId as any)?.title || "Unknown Course",
          studentName: profile?.name || "Unknown Student",
          enrolledAt: e.enrolledAt,
        };
      }),
    );

    const statsResponse = {
      totalCourses,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      latestCourses,
      enrollmentActivity,
    };

    console.log("[AdminStats] Sending Response:", JSON.stringify(statsResponse, null, 2));

    return success(res, 200, statsResponse);
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
});

export default router;

import type { InstructorOverviewResponse } from "@/types/instructor";
import { api, extractData } from "./request";

export const fetchInstructorOverview = () =>
  api.get("/api/reports/instructor/overview").then(extractData) as Promise<InstructorOverviewResponse>;

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
  activeLearners: number;
  activeInstructors: number;
  totalEnrollments: number;
  latestCourses: unknown[];
  enrollmentActivity: { courseTitle: string; studentName: string; enrolledAt: string }[];
}

export interface CoursePerformanceRow {
  courseId: string;
  title: string;
  instructorName: string;
  active: boolean;
  viewCount: number;
  lessonCount: number;
  enrollmentCount: number;
  avgCompletion: number;
}

export const fetchAdminStats = () =>
  api.get("/api/reports/admin/stats").then(extractData) as Promise<AdminStats>;

export const fetchAdminCoursePerformance = () =>
  api
    .get("/api/reports/admin/course-performance")
    .then(extractData) as Promise<CoursePerformanceRow[]>;

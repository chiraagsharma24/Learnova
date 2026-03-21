import type { InstructorOverviewResponse } from "@/types/instructor";
import { api, extractData } from "./request";

<<<<<<< HEAD
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
=======
export const fetchCourseReport = (courseId: string) =>
  api.get(`/api/reports/course/${courseId}`).then(extractData) as Promise<CourseReport>;

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
  totalEnrollments: number;
  latestCourses: any[];
  enrollmentActivity: any[];
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d
}

export const fetchAdminStats = () =>
  api.get("/api/reports/admin/stats").then(extractData) as Promise<AdminStats>;
<<<<<<< HEAD

export const fetchAdminCoursePerformance = () =>
  api
    .get("/api/reports/admin/course-performance")
    .then(extractData) as Promise<CoursePerformanceRow[]>;
=======
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d

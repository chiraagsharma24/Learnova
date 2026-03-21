import type { CourseReport } from "@/types/course";
import { api, extractData } from "./request";

export const fetchCourseReport = (courseId: string) =>
  api.get(`/api/reports/course/${courseId}`).then(extractData) as Promise<CourseReport>;

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
  totalEnrollments: number;
  latestCourses: any[];
  enrollmentActivity: any[];
}

export const fetchAdminStats = () =>
  api.get("/api/reports/admin/stats").then(extractData) as Promise<AdminStats>;

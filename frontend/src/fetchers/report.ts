import type { CourseReport } from "@/types/course";
import { api, extractData } from "./request";

export const fetchCourseReport = (courseId: string) =>
  api.get(`/api/reports/course/${courseId}`).then(extractData) as Promise<CourseReport>;

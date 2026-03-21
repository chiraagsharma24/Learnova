import type { Enrollment } from "@/types/course";
import { api, extractData } from "./request";

export const enrollInCourse = (courseId: string) =>
  api.post("/api/enrollments", { courseId }).then(extractData) as Promise<Enrollment>;

export const fetchMyEnrollments = () => api.get("/api/enrollments/me").then(extractData) as Promise<Enrollment[]>;

export const checkEnrollment = (courseId: string) =>
  api.get(`/api/enrollments/check/${courseId}`).then(extractData) as Promise<{
    enrolled: boolean;
    enrollment: Enrollment | null;
  }>;

export const fetchCourseAttendees = (courseId: string) =>
  api.get(`/api/enrollments/course/${courseId}`).then(extractData) as Promise<Enrollment[]>;

export const removeAttendee = (courseId: string, userId: string) =>
  api.delete(`/api/enrollments/course/${courseId}/user/${userId}`).then(extractData);

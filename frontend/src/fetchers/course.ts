import type { Course } from "@/types/course";
import { api, extractData } from "./request";

export const fetchCourses = (search?: string) =>
  api.get("/api/courses", { params: search ? { search } : {} }).then(extractData) as Promise<Course[]>;

export const fetchAdminCourses = () => api.get("/api/courses/admin").then(extractData) as Promise<Course[]>;

export const fetchCourse = (id: string) => api.get(`/api/courses/${id}`).then(extractData) as Promise<Course>;

export const createCourse = (data: Partial<Course>) =>
  api.post("/api/courses", data).then(extractData) as Promise<Course>;

export const updateCourse = (id: string, data: Partial<Course>) =>
  api.put(`/api/courses/${id}`, data).then(extractData) as Promise<Course>;

export const deleteCourse = (id: string) => api.delete(`/api/courses/${id}`).then(extractData);

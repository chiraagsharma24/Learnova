import type { Lesson } from "@/types/lesson";
import { api, extractData } from "./request";

export const fetchLessons = (courseId: string, params?: { status?: string; search?: string }) =>
  api.get(`/api/courses/${courseId}/lessons`, { params }).then(extractData) as Promise<Lesson[]>;

export const fetchLesson = (courseId: string, lessonId: string) =>
  api.get(`/api/courses/${courseId}/lessons/${lessonId}`).then(extractData) as Promise<Lesson>;

export const createLesson = (courseId: string, data: Partial<Lesson>) =>
  api.post(`/api/courses/${courseId}/lessons`, data).then(extractData) as Promise<Lesson>;

export const updateLesson = (courseId: string, lessonId: string, data: Partial<Lesson>) =>
  api.put(`/api/courses/${courseId}/lessons/${lessonId}`, data).then(extractData) as Promise<Lesson>;

export const deleteLesson = (courseId: string, lessonId: string) =>
  api.delete(`/api/courses/${courseId}/lessons/${lessonId}`).then(extractData);

import type { Quiz } from "@/types/quiz";
import { api, extractData } from "./request";

export const fetchQuiz = (courseId: string, lessonId: string) =>
  api.get(`/api/courses/${courseId}/lessons/${lessonId}/quiz`).then(extractData) as Promise<Quiz>;

export const fetchQuizAdmin = (courseId: string, lessonId: string) =>
  api.get(`/api/courses/${courseId}/lessons/${lessonId}/quiz/admin`).then(extractData) as Promise<Quiz>;

export const createQuiz = (courseId: string, lessonId: string, data: any) =>
  api.post(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, data).then(extractData) as Promise<Quiz>;

export const updateQuiz = (courseId: string, lessonId: string, data: any) =>
  api.put(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, data).then(extractData) as Promise<Quiz>;

export const submitQuizAttempt = (
  courseId: string,
  lessonId: string,
  answers: { questionId: string; choiceIndex: number }[],
) =>
  api.post(`/api/courses/${courseId}/lessons/${lessonId}/quiz/attempt`, { answers }).then(extractData) as Promise<{
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
    earnedPoints: number;
    attemptNumber: number;
    totalPoints: number;
  }>;

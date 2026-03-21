import { api, extractData } from "./request";

export const completeLesson = (lessonId: string, courseId: string) =>
  api.post("/api/progress", { lessonId, courseId }).then(extractData);

export const fetchCourseProgress = (courseId: string) =>
  api.get(`/api/progress/course/${courseId}`).then(extractData) as Promise<
    { lessonId: string; completed: boolean; quizAttempts: number; pointsEarned: number }[]
  >;

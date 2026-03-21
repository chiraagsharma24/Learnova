import type { Review } from "@/types/review";
import { api, extractData } from "./request";

export const fetchReviews = (courseId: string) =>
  api.get(`/api/reviews/course/${courseId}`).then(extractData) as Promise<Review[]>;

export const fetchAllCourseReviews = (courseId: string) =>
  api.get(`/api/reviews/course/${courseId}/all`).then(extractData) as Promise<Review[]>;

export const submitReview = (data: { courseId: string; rating: number; comment: string }) =>
  api.post("/api/reviews", data).then(extractData) as Promise<Review>;

export const approveReview = (data: { courseId: string; reviewId: string }) =>
  api.put(`/api/reviews/${data.reviewId}/approve`).then(extractData) as Promise<Review>;

export const deleteReview = (id: string) => api.delete(`/api/reviews/${id}`).then(extractData);

import type { UserProfile } from "@/types/user";
import { api, extractData } from "./request";

export const fetchMe = () => api.get("/api/users/me").then(extractData) as Promise<UserProfile>;

export const becomeInstructor = () =>
  api.post("/api/users/become-instructor").then(extractData) as Promise<UserProfile>;

export const fetchInstructorRequests = () =>
  api.get("/api/users/admin/instructor-requests").then(extractData) as Promise<UserProfile[]>;

export const approveInstructorRequest = (userId: string) =>
  api.post(`/api/users/admin/instructor-requests/${userId}/approve`).then(extractData);

export const rejectInstructorRequest = (userId: string) =>
  api.post(`/api/users/admin/instructor-requests/${userId}/reject`).then(extractData);

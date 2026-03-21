import type { UserProfile } from "@/types/user";
import { api, extractData } from "./request";

export const fetchMe = () => api.get("/api/users/me").then(extractData) as Promise<UserProfile>;

export interface StaffPickerUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export const fetchStaffForCourseAdmin = () =>
  api.get("/api/users/staff-for-course-admin").then(extractData) as Promise<StaffPickerUser[]>;

export const becomeInstructor = () =>
  api.post("/api/users/become-instructor").then(extractData) as Promise<UserProfile>;

export const fetchInstructorRequests = () =>
  api.get("/api/users/admin/instructor-requests").then(extractData) as Promise<UserProfile[]>;

export const approveInstructorRequest = (userId: string) =>
  api.post(`/api/users/admin/instructor-requests/${userId}/approve`).then(extractData);

export const rejectInstructorRequest = (userId: string) =>
  api.post(`/api/users/admin/instructor-requests/${userId}/reject`).then(extractData);
<<<<<<< HEAD

export const fetchAdminUserList = (role?: string) =>
  api
    .get("/api/users/admin/users", { params: role ? { role } : {} })
    .then(extractData) as Promise<
    {
      userId: string;
      name: string;
      email: string;
      role: "learner" | "instructor" | "admin";
      blocked?: boolean;
    }[]
  >;

export const patchAdminUser = (
  userId: string,
  body: { blocked?: boolean; role?: "learner" | "instructor" | "admin" },
) => api.patch(`/api/users/admin/users/${userId}`, body).then(extractData) as Promise<UserProfile>;
=======
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d

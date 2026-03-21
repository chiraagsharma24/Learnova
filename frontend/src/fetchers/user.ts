import type { UserProfile } from "@/types/user";
import { api, extractData } from "./request";

export const fetchMe = () => api.get("/api/users/me").then(extractData) as Promise<UserProfile>;

export const becomeInstructor = () =>
  api.post("/api/users/become-instructor").then(extractData) as Promise<UserProfile>;

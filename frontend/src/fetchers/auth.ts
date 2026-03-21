import { api } from "./request";

export const loginUser = (email: string, password: string) =>
  api.post("/api/auth/sign-in/email", { email, password }).then((r) => r.data);

export const registerUser = (name: string, email: string, password: string, role?: string) =>
  api.post("/api/auth/sign-up/email", { name, email, password, role }).then((r) => r.data);

export const logoutUser = () => api.post("/api/auth/sign-out").then((r) => r.data);

export const getSession = () => api.get("/api/auth/get-session").then((r) => r.data);

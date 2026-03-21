import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:1337";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

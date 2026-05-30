import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export const SESSION_EXPIRED_EVENT = "sportsync:session-expired";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      api.defaults.headers.common.Authorization
    ) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export function setAccessToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

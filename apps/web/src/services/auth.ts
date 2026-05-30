import { api } from "./api";
import type { ApiSuccess, AuthResponse, User } from "../types/auth";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: "ORGANIZER" | "TEAM_CAPTAIN";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  const response = await api.post<ApiSuccess<AuthResponse>>("/auth/register", payload);
  return response.data.data;
}

export async function login(payload: LoginPayload) {
  const response = await api.post<ApiSuccess<AuthResponse>>("/auth/login", payload);
  return response.data.data;
}

export async function getMe() {
  const response = await api.get<ApiSuccess<{ user: User }>>("/auth/me");
  return response.data.data.user;
}

export async function logout(refreshToken: string) {
  const response = await api.post<ApiSuccess<{ message: string }>>("/auth/logout", {
    refreshToken,
  });
  return response.data.data;
}

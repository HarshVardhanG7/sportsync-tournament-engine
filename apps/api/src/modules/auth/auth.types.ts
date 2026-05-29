import type { Role, User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: SafeUser;
} & AuthTokens;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: Role;
};

export type LoginInput = {
  email: string;
  password: string;
};

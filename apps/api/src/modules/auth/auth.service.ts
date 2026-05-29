import { Role } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import {
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  signAccessToken,
} from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { authRepository, sanitizeUser } from "./auth.repository.js";
import type { AuthResponse, LoginInput, RegisterInput } from "./auth.types.js";

async function issueTokenPair(user: { id: string; role: Role }) {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await authRepository.createRefreshToken({
    tokenHash,
    userId: user.id,
    expiresAt: getRefreshTokenExpiresAt(),
  });

  return {
    accessToken,
    refreshToken,
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? Role.ORGANIZER,
    });
    const tokens = await issueTokenPair(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordIsValid = await verifyPassword(input.password, user.passwordHash);

    if (!passwordIsValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = await issueTokenPair(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const oldTokenHash = hashRefreshToken(refreshToken);
    const storedRefreshToken = await authRepository.findRefreshToken(oldTokenHash);

    if (
      !storedRefreshToken ||
      storedRefreshToken.revokedAt ||
      storedRefreshToken.expiresAt <= new Date()
    ) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const accessToken = signAccessToken({
      userId: storedRefreshToken.user.id,
      role: storedRefreshToken.user.role,
    });

    await authRepository.rotateRefreshToken({
      oldTokenHash,
      newTokenHash,
      userId: storedRefreshToken.userId,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    return {
      user: sanitizeUser(storedRefreshToken.user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedRefreshToken = await authRepository.findRefreshToken(tokenHash);

    if (storedRefreshToken && !storedRefreshToken.revokedAt) {
      await authRepository.revokeRefreshToken(tokenHash);
    }

    return {
      message: "Logged out successfully",
    };
  },

  getCurrentUser(user: Express.User) {
    return {
      user,
    };
  },
};

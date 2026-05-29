import type { Prisma, User } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  },

  createRefreshToken(data: { tokenHash: string; userId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({
      data,
    });
  },

  findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  },

  rotateRefreshToken(input: {
    oldTokenHash: string;
    newTokenHash: string;
    userId: string;
    expiresAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { tokenHash: input.oldTokenHash },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: input.newTokenHash,
          userId: input.userId,
          expiresAt: input.expiresAt,
        },
      });
    });
  },
};

export function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

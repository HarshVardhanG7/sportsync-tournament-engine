import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const teamInclude = {
  tournament: true,
} satisfies Prisma.TeamInclude;

export const playerRepository = {
  findActiveTeamById(teamId: string) {
    return prisma.team.findFirst({
      where: {
        id: teamId,
        deletedAt: null,
      },
      include: teamInclude,
    });
  },

  findActivePlayerById(playerId: string) {
    return prisma.player.findFirst({
      where: {
        id: playerId,
        deletedAt: null,
      },
      include: {
        team: {
          include: teamInclude,
        },
      },
    });
  },

  findActiveByTeam(teamId: string) {
    return prisma.player.findMany({
      where: {
        teamId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  findActiveJerseyNumber(teamId: string, jerseyNumber: number, excludePlayerId?: string) {
    return prisma.player.findFirst({
      where: {
        teamId,
        jerseyNumber,
        deletedAt: null,
        ...(excludePlayerId ? { id: { not: excludePlayerId } } : {}),
      },
      select: { id: true },
    });
  },

  create(data: Prisma.PlayerUncheckedCreateInput, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.create({
        data,
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: player.id,
        },
      });

      return player;
    });
  },

  update(
    playerId: string,
    data: Prisma.PlayerUncheckedUpdateInput,
    auditLog: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.update({
        where: { id: playerId },
        data,
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: playerId,
        },
      });

      return player;
    });
  },

  softDelete(playerId: string, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.update({
        where: { id: playerId },
        data: {
          deletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: playerId,
        },
      });

      return player;
    });
  },
};

import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const teamRepository = {
  findTournamentById(tournamentId: string) {
    return prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        deletedAt: null,
      },
    });
  },

  findCaptainById(captainId: string) {
    return prisma.user.findUnique({
      where: { id: captainId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },

  findCaptainTeamInTournament(captainId: string, tournamentId: string, excludeTeamId?: string) {
    return prisma.team.findFirst({
      where: {
        captainId,
        tournamentId,
        deletedAt: null,
        ...(excludeTeamId ? { id: { not: excludeTeamId } } : {}),
      },
      select: { id: true },
    });
  },

  findActiveTeamName(tournamentId: string, name: string, excludeTeamId?: string) {
    return prisma.team.findFirst({
      where: {
        tournamentId,
        name,
        deletedAt: null,
        ...(excludeTeamId ? { id: { not: excludeTeamId } } : {}),
      },
      select: { id: true },
    });
  },

  findActiveById(teamId: string) {
    return prisma.team.findFirst({
      where: {
        id: teamId,
        deletedAt: null,
      },
      include: {
        tournament: true,
        captain: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            players: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });
  },

  findActiveByTournament(tournamentId: string, captainId?: string) {
    return prisma.team.findMany({
      where: {
        tournamentId,
        deletedAt: null,
        ...(captainId ? { captainId } : {}),
      },
      include: {
        captain: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            players: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  create(data: Prisma.TeamUncheckedCreateInput, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data,
        include: {
          captain: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              players: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: team.id,
        },
      });

      return team;
    });
  },

  update(
    teamId: string,
    data: Prisma.TeamUncheckedUpdateInput,
    auditLog: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data,
        include: {
          captain: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              players: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: teamId,
        },
      });

      return team;
    });
  },

  softDelete(teamId: string, auditLog: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: {
          deletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          ...auditLog,
          entityId: teamId,
        },
      });

      return team;
    });
  },
};

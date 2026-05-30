import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const matchTeamSelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

export const fixtureRepository = {
  findTournamentById(tournamentId: string) {
    return prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        deletedAt: null,
      },
    });
  },

  findActiveTeams(tournamentId: string) {
    return prisma.team.findMany({
      where: {
        tournamentId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  countMatches(tournamentId: string) {
    return prisma.match.count({
      where: {
        tournamentId,
      },
    });
  },

  findMatches(tournamentId: string) {
    return prisma.match.findMany({
      where: {
        tournamentId,
      },
      include: {
        teamA: {
          select: matchTeamSelect,
        },
        teamB: {
          select: matchTeamSelect,
        },
        winnerTeam: {
          select: matchTeamSelect,
        },
      },
      orderBy: {
        matchNumber: "asc",
      },
    });
  },

  createFixtures(
    tournamentId: string,
    matches: Prisma.MatchCreateManyInput[],
    auditLog: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.match.createMany({
        data: matches,
      });

      await tx.auditLog.create({
        data: auditLog,
      });

      return tx.match.findMany({
        where: {
          tournamentId,
        },
        include: {
          teamA: {
            select: matchTeamSelect,
          },
          teamB: {
            select: matchTeamSelect,
          },
          winnerTeam: {
            select: matchTeamSelect,
          },
        },
        orderBy: {
          matchNumber: "asc",
        },
      });
    });
  },
};

import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { PrismaTransaction } from "../standings/standing.repository.js";

const matchTeamSelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

function client(tx?: PrismaTransaction) {
  return tx ?? prisma;
}

export const matchRepository = {
  transaction<T>(callback: (tx: PrismaTransaction) => Promise<T>) {
    return prisma.$transaction(callback);
  },

  findTournamentById(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).tournament.findFirst({
      where: {
        id: tournamentId,
        deletedAt: null,
      },
    });
  },

  countCaptainTeams(tournamentId: string, captainId: string, tx?: PrismaTransaction) {
    return client(tx).team.count({
      where: {
        tournamentId,
        captainId,
        deletedAt: null,
      },
    });
  },

  findMatchesByTournament(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).match.findMany({
      where: {
        tournamentId,
        teamA: {
          deletedAt: null,
        },
        teamB: {
          deletedAt: null,
        },
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

  findMatchById(matchId: string, tx?: PrismaTransaction) {
    return client(tx).match.findFirst({
      where: {
        id: matchId,
        teamA: {
          deletedAt: null,
        },
        teamB: {
          deletedAt: null,
        },
      },
      include: {
        tournament: true,
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
    });
  },

  updateScore(
    matchId: string,
    data: Prisma.MatchUncheckedUpdateInput,
    tx?: PrismaTransaction,
  ) {
    return client(tx).match.update({
      where: { id: matchId },
      data,
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
    });
  },

  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput, tx?: PrismaTransaction) {
    return client(tx).auditLog.create({
      data,
    });
  },
};

import { MatchStage, MatchStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

type PrismaTransaction = Prisma.TransactionClient;

const matchTeamSelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

function client(tx?: PrismaTransaction) {
  return tx ?? prisma;
}

export const qualificationRepository = {
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

  countActiveTeams(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).team.count({
      where: {
        tournamentId,
        deletedAt: null,
      },
    });
  },

  countIncompleteLeagueMatches(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).match.count({
      where: {
        tournamentId,
        stage: MatchStage.LEAGUE,
        status: {
          not: MatchStatus.COMPLETED,
        },
        teamA: {
          deletedAt: null,
        },
        teamB: {
          deletedAt: null,
        },
      },
    });
  },

  findStandings(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).standing.findMany({
      where: {
        tournamentId,
        team: {
          deletedAt: null,
        },
      },
      include: {
        team: {
          select: matchTeamSelect,
        },
      },
      orderBy: {
        rank: "asc",
      },
    });
  },

  findPlayoffMatches(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).match.findMany({
      where: {
        tournamentId,
        stage: {
          in: [MatchStage.SEMI_FINAL, MatchStage.FINAL],
        },
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
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    });
  },

  getMaxMatchNumber(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).match.aggregate({
      where: { tournamentId },
      _max: {
        matchNumber: true,
      },
    });
  },

  async createMatches(
    matches: Prisma.MatchCreateManyInput[],
    auditLog: Prisma.AuditLogUncheckedCreateInput,
    tx?: PrismaTransaction,
  ) {
    const db = client(tx);

    await db.match.createMany({
      data: matches,
    });

    await db.auditLog.create({
      data: auditLog,
    });
  },

  async completeTournament(
    tournamentId: string,
    winnerTeamId: string,
    auditLog: Prisma.AuditLogUncheckedCreateInput,
    tx?: PrismaTransaction,
  ) {
    const db = client(tx);

    const tournament = await db.tournament.update({
      where: { id: tournamentId },
      data: {
        winnerTeamId,
        status: "COMPLETED",
      },
    });

    await db.auditLog.create({
      data: auditLog,
    });

    return tournament;
  },
};

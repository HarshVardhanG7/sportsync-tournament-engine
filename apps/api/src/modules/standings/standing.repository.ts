import { MatchStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export type PrismaTransaction = Prisma.TransactionClient;

const standingTeamSelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

function client(tx?: PrismaTransaction) {
  return tx ?? prisma;
}

export const standingRepository = {
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

  findActiveTeams(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).team.findMany({
      where: {
        tournamentId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  findCompletedMatches(tournamentId: string, tx?: PrismaTransaction) {
    return client(tx).match.findMany({
      where: {
        tournamentId,
        status: MatchStatus.COMPLETED,
        teamA: {
          deletedAt: null,
        },
        teamB: {
          deletedAt: null,
        },
      },
      select: {
        teamAId: true,
        teamBId: true,
        winnerTeamId: true,
        status: true,
        tournamentId: true,
      },
    });
  },

  async upsertStandings(
    standings: {
      tournamentId: string;
      teamId: string;
      played: number;
      won: number;
      lost: number;
      drawn: number;
      points: number;
      rank: number;
    }[],
    tx?: PrismaTransaction,
  ) {
    const db = client(tx);

    for (const standing of standings) {
      await db.standing.upsert({
        where: {
          tournamentId_teamId: {
            tournamentId: standing.tournamentId,
            teamId: standing.teamId,
          },
        },
        create: standing,
        update: {
          played: standing.played,
          won: standing.won,
          lost: standing.lost,
          drawn: standing.drawn,
          points: standing.points,
          rank: standing.rank,
        },
      });
    }
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
          select: standingTeamSelect,
        },
      },
      orderBy: {
        rank: "asc",
      },
    });
  },

  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput, tx?: PrismaTransaction) {
    return client(tx).auditLog.create({
      data,
    });
  },
};

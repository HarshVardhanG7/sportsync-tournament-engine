import { MatchStage, TournamentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const publicStatuses = [
  TournamentStatus.PUBLISHED,
  TournamentStatus.ONGOING,
  TournamentStatus.COMPLETED,
];

const publicTournamentWhere = {
  deletedAt: null,
  status: {
    in: publicStatuses,
  },
} satisfies Prisma.TournamentWhereInput;

const teamBasicSelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

const captainBasicSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

export const publicRepository = {
  countPublicTournaments(search?: string) {
    return prisma.tournament.count({
      where: {
        ...publicTournamentWhere,
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  sportType: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
    });
  },

  findPublicTournaments(input: { skip: number; take: number; search?: string }) {
    return prisma.tournament.findMany({
      where: {
        ...publicTournamentWhere,
        ...(input.search
          ? {
              OR: [
                {
                  name: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
                {
                  sportType: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sportType: true,
        status: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: input.skip,
      take: input.take,
    });
  },

  findPublicTournamentBySlug(slug: string) {
    return prisma.tournament.findFirst({
      where: {
        ...publicTournamentWhere,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sportType: true,
        description: true,
        format: true,
        status: true,
        startDate: true,
        endDate: true,
        winnerTeam: {
          select: teamBasicSelect,
        },
        _count: {
          select: {
            teams: {
              where: {
                deletedAt: null,
              },
            },
            matches: true,
          },
        },
      },
    });
  },

  findPublicTeams(tournamentId: string) {
    return prisma.team.findMany({
      where: {
        tournamentId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        captain: {
          select: captainBasicSelect,
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
        name: "asc",
      },
    });
  },

  findPublicMatches(tournamentId: string) {
    return prisma.match.findMany({
      where: {
        tournamentId,
        teamA: {
          deletedAt: null,
        },
        teamB: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        matchNumber: true,
        stage: true,
        status: true,
        teamAScore: true,
        teamBScore: true,
        teamA: {
          select: teamBasicSelect,
        },
        teamB: {
          select: teamBasicSelect,
        },
        winnerTeam: {
          select: teamBasicSelect,
        },
      },
      orderBy: [{ stage: "asc" }, { matchNumber: "asc" }],
    });
  },

  findPublicStandings(tournamentId: string) {
    return prisma.standing.findMany({
      where: {
        tournamentId,
        team: {
          deletedAt: null,
        },
      },
      select: {
        rank: true,
        played: true,
        won: true,
        lost: true,
        drawn: true,
        points: true,
        team: {
          select: teamBasicSelect,
        },
      },
      orderBy: {
        rank: "asc",
      },
    });
  },
};

export function stageSortValue(stage: MatchStage) {
  const order = {
    [MatchStage.LEAGUE]: 1,
    [MatchStage.QUARTER_FINAL]: 2,
    [MatchStage.SEMI_FINAL]: 3,
    [MatchStage.FINAL]: 4,
  };

  return order[stage];
}

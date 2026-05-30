import { TournamentStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { publicRepository, stageSortValue } from "./public.repository.js";
import type { PublicTournamentQuery, PublicTournamentSlugParams } from "./public.types.js";

async function getVisibleTournament(slug: string) {
  const tournament = await publicRepository.findPublicTournamentBySlug(slug);

  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }

  return tournament;
}

export const publicService = {
  async listTournaments(query: PublicTournamentQuery) {
    const skip = (query.page - 1) * query.limit;
    const [total, tournaments] = await Promise.all([
      publicRepository.countPublicTournaments(query.search),
      publicRepository.findPublicTournaments({
        skip,
        take: query.limit,
        ...(query.search ? { search: query.search } : {}),
      }),
    ]);

    return {
      tournaments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getTournament(params: PublicTournamentSlugParams) {
    const tournament = await getVisibleTournament(params.slug);
    const { _count, winnerTeam, ...publicTournament } = tournament;

    return {
      tournament: {
        ...publicTournament,
        teamsCount: _count.teams,
        matchesCount: _count.matches,
        ...(tournament.status === TournamentStatus.COMPLETED ? { winnerTeam } : {}),
      },
    };
  },

  async getTeams(params: PublicTournamentSlugParams) {
    const tournament = await getVisibleTournament(params.slug);
    const teams = await publicRepository.findPublicTeams(tournament.id);

    return { teams };
  },

  async getMatches(params: PublicTournamentSlugParams) {
    const tournament = await getVisibleTournament(params.slug);
    const matches = await publicRepository.findPublicMatches(tournament.id);

    matches.sort((a, b) => {
      const stageDiff = stageSortValue(a.stage) - stageSortValue(b.stage);

      if (stageDiff !== 0) {
        return stageDiff;
      }

      return a.matchNumber - b.matchNumber;
    });

    return { matches };
  },

  async getStandings(params: PublicTournamentSlugParams) {
    const tournament = await getVisibleTournament(params.slug);
    const standings = await publicRepository.findPublicStandings(tournament.id);

    return { standings };
  },
};

import type { ApiSuccess } from "../types/auth";
import type {
  PublicTournamentDetails,
  PublicTournamentListResponse,
  PublicTournamentMatch,
  PublicTournamentStanding,
  PublicTournamentTeam,
} from "../types/public-tournament";
import { api } from "./api";

export type PublicTournamentListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getPublicTournaments(params: PublicTournamentListParams = {}) {
  const response = await api.get<ApiSuccess<PublicTournamentListResponse>>("/public/tournaments", {
    params,
  });

  return response.data.data;
}

export async function getPublicTournament(slug: string) {
  const response = await api.get<ApiSuccess<{ tournament: PublicTournamentDetails }>>(
    `/public/tournaments/${slug}`,
  );

  return response.data.data.tournament;
}

export async function getPublicTournamentTeams(slug: string) {
  const response = await api.get<ApiSuccess<{ teams: PublicTournamentTeam[] }>>(
    `/public/tournaments/${slug}/teams`,
  );

  return response.data.data.teams;
}

export async function getPublicTournamentMatches(slug: string) {
  const response = await api.get<ApiSuccess<{ matches: PublicTournamentMatch[] }>>(
    `/public/tournaments/${slug}/matches`,
  );

  return response.data.data.matches;
}

export async function getPublicTournamentStandings(slug: string) {
  const response = await api.get<ApiSuccess<{ standings: PublicTournamentStanding[] }>>(
    `/public/tournaments/${slug}/standings`,
  );

  return response.data.data.standings;
}

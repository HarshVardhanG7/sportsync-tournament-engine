import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Match, UpdateScorePayload } from "../types/match";
import type { Standing } from "../types/standing";

export async function getMatches(tournamentId: string) {
  const response = await api.get<ApiSuccess<{ matches: Match[] }>>(
    `/tournaments/${tournamentId}/matches`,
  );
  return response.data.data.matches;
}

export async function updateMatchScore(matchId: string, payload: UpdateScorePayload) {
  const response = await api.patch<ApiSuccess<{ match: Match; standings: Standing[] }>>(
    `/matches/${matchId}/score`,
    payload,
  );
  return response.data.data;
}

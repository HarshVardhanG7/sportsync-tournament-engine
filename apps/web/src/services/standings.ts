import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Standing } from "../types/standing";

export async function getStandings(tournamentId: string) {
  const response = await api.get<ApiSuccess<{ standings: Standing[] }>>(
    `/tournaments/${tournamentId}/standings`,
  );
  return response.data.data.standings;
}

export async function recalculateStandings(tournamentId: string) {
  const response = await api.post<ApiSuccess<{ standings: Standing[] }>>(
    `/tournaments/${tournamentId}/standings/recalculate`,
  );
  return response.data.data.standings;
}

import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { Match } from "../types/match";

export async function getFixtures(tournamentId: string) {
  const response = await api.get<ApiSuccess<{ fixtures: Match[] }>>(
    `/tournaments/${tournamentId}/fixtures`,
  );
  return response.data.data.fixtures;
}

export async function generateFixtures(tournamentId: string) {
  const response = await api.post<ApiSuccess<{ fixtures: Match[] }>>(
    `/tournaments/${tournamentId}/fixtures/generate`,
  );
  return response.data.data.fixtures;
}

import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { CreateTeamPayload, Team, UpdateTeamPayload } from "../types/team";

export async function getTournamentTeams(tournamentId: string) {
  const response = await api.get<ApiSuccess<{ teams: Team[] }>>(
    `/tournaments/${tournamentId}/teams`,
  );
  return response.data.data.teams;
}

export async function getTeam(teamId: string) {
  const response = await api.get<ApiSuccess<{ team: Team }>>(`/teams/${teamId}`);
  return response.data.data.team;
}

export async function createTeam(tournamentId: string, payload: CreateTeamPayload) {
  const response = await api.post<ApiSuccess<{ team: Team }>>(
    `/tournaments/${tournamentId}/teams`,
    payload,
  );
  return response.data.data.team;
}

export async function updateTeam(teamId: string, payload: UpdateTeamPayload) {
  const response = await api.patch<ApiSuccess<{ team: Team }>>(`/teams/${teamId}`, payload);
  return response.data.data.team;
}

export async function deleteTeam(teamId: string) {
  const response = await api.delete<ApiSuccess<{ team: Team }>>(`/teams/${teamId}`);
  return response.data.data.team;
}

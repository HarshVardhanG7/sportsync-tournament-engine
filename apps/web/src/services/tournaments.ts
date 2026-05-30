import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { CreateTournamentPayload, Tournament, UpdateTournamentPayload } from "../types/tournament";

export async function getMyTournaments() {
  const response = await api.get<ApiSuccess<{ tournaments: Tournament[] }>>("/tournaments/my");
  return response.data.data.tournaments;
}

export async function getTournament(id: string) {
  const response = await api.get<ApiSuccess<{ tournament: Tournament }>>(`/tournaments/${id}`);
  return response.data.data.tournament;
}

export async function createTournament(payload: CreateTournamentPayload) {
  const response = await api.post<ApiSuccess<{ tournament: Tournament }>>("/tournaments", payload);
  return response.data.data.tournament;
}

export async function updateTournament(id: string, payload: UpdateTournamentPayload) {
  const response = await api.patch<ApiSuccess<{ tournament: Tournament }>>(`/tournaments/${id}`, payload);
  return response.data.data.tournament;
}

export async function publishTournament(id: string) {
  const response = await api.patch<ApiSuccess<{ tournament: Tournament }>>(`/tournaments/${id}/publish`);
  return response.data.data.tournament;
}

export async function completeTournament(id: string) {
  const response = await api.patch<ApiSuccess<{ tournament: Tournament }>>(`/tournaments/${id}/complete`);
  return response.data.data.tournament;
}

export async function deleteTournament(id: string) {
  const response = await api.delete<ApiSuccess<{ tournament: Tournament }>>(`/tournaments/${id}`);
  return response.data.data.tournament;
}

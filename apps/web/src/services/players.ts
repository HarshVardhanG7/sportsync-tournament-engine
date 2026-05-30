import { api } from "./api";
import type { ApiSuccess } from "../types/auth";
import type { CreatePlayerPayload, Player, UpdatePlayerPayload } from "../types/player";

export async function getTeamPlayers(teamId: string) {
  const response = await api.get<ApiSuccess<{ players: Player[] }>>(`/teams/${teamId}/players`);
  return response.data.data.players;
}

export async function createPlayer(teamId: string, payload: CreatePlayerPayload) {
  const response = await api.post<ApiSuccess<{ player: Player }>>(
    `/teams/${teamId}/players`,
    payload,
  );
  return response.data.data.player;
}

export async function updatePlayer(playerId: string, payload: UpdatePlayerPayload) {
  const response = await api.patch<ApiSuccess<{ player: Player }>>(`/players/${playerId}`, payload);
  return response.data.data.player;
}

export async function deletePlayer(playerId: string) {
  const response = await api.delete<ApiSuccess<{ player: Player }>>(`/players/${playerId}`);
  return response.data.data.player;
}

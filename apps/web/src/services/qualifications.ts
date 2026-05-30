import type { ApiSuccess } from "../types/auth";
import type { Match } from "../types/match";
import type { Tournament } from "../types/tournament";
import { api } from "./api";

export type QualificationGenerateResult = {
  qualifications: Match[];
  tournament?: Tournament;
};

export async function getQualifications(tournamentId: string) {
  const response = await api.get<ApiSuccess<{ qualifications: Match[] }>>(
    `/tournaments/${tournamentId}/qualifications`,
  );

  return response.data.data.qualifications;
}

export async function generateQualifications(tournamentId: string) {
  const response = await api.post<ApiSuccess<QualificationGenerateResult>>(
    `/tournaments/${tournamentId}/qualifications/generate`,
  );

  return response.data.data;
}

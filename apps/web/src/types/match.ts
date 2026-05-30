import type { Team } from "./team";

export type MatchStage = "LEAGUE" | "QUARTER_FINAL" | "SEMI_FINAL" | "FINAL";
export type MatchStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export type Match = {
  id: string;
  tournamentId: string;
  stage: MatchStage;
  round: number;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  teamAScore?: number | null;
  teamBScore?: number | null;
  winnerTeamId?: string | null;
  status: MatchStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  teamA?: Pick<Team, "id" | "name">;
  teamB?: Pick<Team, "id" | "name">;
  winnerTeam?: Pick<Team, "id" | "name"> | null;
};

export type UpdateScorePayload = {
  teamAScore: number;
  teamBScore: number;
};

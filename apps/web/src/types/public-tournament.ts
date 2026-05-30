import type { MatchStage, MatchStatus } from "./match";
import type { TournamentFormat, TournamentStatus } from "./tournament";

export type PublicTeamBasic = {
  id: string;
  name: string;
};

export type PublicCaptain = {
  id: string;
  name: string;
  email: string;
};

export type PublicTournamentListItem = {
  id: string;
  name: string;
  slug: string;
  sportType: string;
  format?: TournamentFormat;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
};

export type PublicTournamentDetails = PublicTournamentListItem & {
  description?: string | null;
  format: TournamentFormat;
  teamsCount: number;
  matchesCount: number;
  winnerTeam?: PublicTeamBasic | null;
};

export type PublicTournamentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicTournamentListResponse = {
  tournaments: PublicTournamentListItem[];
  pagination: PublicTournamentPagination;
};

export type PublicTournamentTeam = PublicTeamBasic & {
  captain?: PublicCaptain | null;
  _count?: {
    players: number;
  };
};

export type PublicTournamentMatch = {
  id: string;
  matchNumber: number;
  stage: MatchStage;
  status: MatchStatus;
  teamAScore?: number | null;
  teamBScore?: number | null;
  teamA: PublicTeamBasic;
  teamB: PublicTeamBasic;
  winnerTeam?: PublicTeamBasic | null;
};

export type PublicTournamentStanding = {
  rank?: number | null;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  team: PublicTeamBasic;
};

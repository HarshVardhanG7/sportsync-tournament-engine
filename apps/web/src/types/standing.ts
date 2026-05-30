import type { Team } from "./team";

export type Standing = {
  id?: string;
  tournamentId?: string;
  teamId?: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  rank?: number | null;
  team?: Pick<Team, "id" | "name">;
};

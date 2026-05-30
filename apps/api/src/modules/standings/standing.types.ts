import type { Match, Team, TournamentFormat } from "@prisma/client";

export type StandingTournamentParams = {
  tournamentId: string;
};

export type StandingTransaction = {
  activeTeams: Pick<Team, "id" | "name">[];
  completedMatches: Pick<
    Match,
    "teamAId" | "teamBId" | "winnerTeamId" | "status" | "tournamentId"
  >[];
  tournamentFormat: TournamentFormat;
};

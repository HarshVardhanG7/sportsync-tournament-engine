export type TournamentTeamsParams = {
  tournamentId: string;
};

export type TeamIdParams = {
  teamId: string;
};

export type CreateTeamInput = {
  name: string;
  captainId?: string;
};

export type UpdateTeamInput = Partial<CreateTeamInput>;

export type TeamPlayersParams = {
  teamId: string;
};

export type PlayerIdParams = {
  playerId: string;
};

export type CreatePlayerInput = {
  name: string;
  jerseyNumber?: number;
  position?: string;
};

export type UpdatePlayerInput = Partial<CreatePlayerInput>;

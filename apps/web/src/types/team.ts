import type { User } from "./auth";

export type Team = {
  id: string;
  name: string;
  tournamentId: string;
  captainId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  captain?: Pick<User, "id" | "name" | "email" | "role"> | null;
  _count?: {
    players: number;
  };
};

export type CreateTeamPayload = {
  name: string;
};

export type UpdateTeamPayload = {
  name?: string;
};

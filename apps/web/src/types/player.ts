export type Player = {
  id: string;
  name: string;
  jerseyNumber?: number | null;
  position?: string | null;
  teamId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlayerPayload = {
  name: string;
  jerseyNumber?: number;
  position?: string;
};

export type UpdatePlayerPayload = {
  name?: string;
  jerseyNumber?: number | null;
  position?: string | null;
};

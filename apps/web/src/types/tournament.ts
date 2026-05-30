export type TournamentFormat = "ROUND_ROBIN" | "KNOCKOUT";
export type TournamentStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED";

export type Tournament = {
  id: string;
  name: string;
  slug: string;
  sportType: string;
  description?: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  organizerId: string;
  winnerTeamId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    teams: number;
    matches: number;
  };
};

export type CreateTournamentPayload = {
  name: string;
  sportType: string;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  description?: string;
};

export type UpdateTournamentPayload = Partial<CreateTournamentPayload>;

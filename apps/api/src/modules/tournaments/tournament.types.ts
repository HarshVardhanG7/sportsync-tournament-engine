import type { TournamentFormat } from "@prisma/client";

export type TournamentIdParams = {
  id: string;
};

export type CreateTournamentInput = {
  name: string;
  sportType: string;
  format: TournamentFormat;
  startDate: Date;
  endDate: Date;
  description?: string;
};

export type UpdateTournamentInput = Partial<CreateTournamentInput>;

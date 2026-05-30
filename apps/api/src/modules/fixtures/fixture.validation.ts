import { z } from "zod";

export const fixtureTournamentParamsSchema = z.object({
  tournamentId: z.string().min(1, "Tournament id is required"),
});

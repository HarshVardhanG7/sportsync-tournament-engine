import { z } from "zod";

export const standingTournamentParamsSchema = z.object({
  tournamentId: z.string().min(1, "Tournament id is required"),
});

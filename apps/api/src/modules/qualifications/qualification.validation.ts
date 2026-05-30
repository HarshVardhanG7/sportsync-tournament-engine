import { z } from "zod";

export const qualificationTournamentParamsSchema = z.object({
  tournamentId: z.string().min(1, "Tournament id is required"),
});

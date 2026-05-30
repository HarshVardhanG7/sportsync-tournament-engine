import { z } from "zod";

export const scoreFormSchema = z.object({
  teamAScore: z.coerce.number().int("Score must be a whole number").min(0, "Score cannot be negative"),
  teamBScore: z.coerce.number().int("Score must be a whole number").min(0, "Score cannot be negative"),
});

export type ScoreFormValues = z.infer<typeof scoreFormSchema>;

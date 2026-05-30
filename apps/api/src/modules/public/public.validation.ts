import { z } from "zod";

export const publicTournamentSlugParamsSchema = z.object({
  slug: z.string().trim().min(1, "Tournament slug is required"),
});

export const publicTournamentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
});

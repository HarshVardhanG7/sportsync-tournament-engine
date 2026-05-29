import { z } from "zod";

export const tournamentTeamsParamsSchema = z.object({
  tournamentId: z.string().min(1, "Tournament id is required"),
});

export const teamIdParamsSchema = z.object({
  teamId: z.string().min(1, "Team id is required"),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters"),
  captainId: z.string().trim().min(1, "Captain id is required").optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters").optional(),
  captainId: z.string().trim().min(1, "Captain id is required").nullable().optional(),
});

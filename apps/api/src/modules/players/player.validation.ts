import { z } from "zod";

export const teamPlayersParamsSchema = z.object({
  teamId: z.string().min(1, "Team id is required"),
});

export const playerIdParamsSchema = z.object({
  playerId: z.string().min(1, "Player id is required"),
});

export const createPlayerSchema = z.object({
  name: z.string().trim().min(2, "Player name must be at least 2 characters"),
  jerseyNumber: z.number().int().positive().optional(),
  position: z.string().trim().min(1, "Position cannot be empty").optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().trim().min(2, "Player name must be at least 2 characters").optional(),
  jerseyNumber: z.number().int().positive().nullable().optional(),
  position: z.string().trim().min(1, "Position cannot be empty").nullable().optional(),
});

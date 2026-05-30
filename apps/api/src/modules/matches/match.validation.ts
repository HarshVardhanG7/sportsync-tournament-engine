import { z } from "zod";

export const matchTournamentParamsSchema = z.object({
  tournamentId: z.string().min(1, "Tournament id is required"),
});

export const matchIdParamsSchema = z.object({
  matchId: z.string().min(1, "Match id is required"),
});

export const updateMatchScoreSchema = z.object({
  teamAScore: z.number().int().min(0, "Team A score must be a non-negative integer"),
  teamBScore: z.number().int().min(0, "Team B score must be a non-negative integer"),
});

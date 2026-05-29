import { TournamentFormat } from "@prisma/client";
import { z } from "zod";

const dateSchema = z.coerce.date({
  required_error: "Date is required",
  invalid_type_error: "Date must be valid",
});

export const tournamentIdParamsSchema = z.object({
  id: z.string().min(1, "Tournament id is required"),
});

export const createTournamentSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    sportType: z.string().trim().min(2, "Sport type must be at least 2 characters"),
    format: z.enum([TournamentFormat.ROUND_ROBIN, TournamentFormat.KNOCKOUT]),
    startDate: dateSchema,
    endDate: dateSchema,
    description: z.string().trim().optional(),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  });

export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    sportType: z.string().trim().min(2, "Sport type must be at least 2 characters").optional(),
    format: z.enum([TournamentFormat.ROUND_ROBIN, TournamentFormat.KNOCKOUT]).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    description: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.startDate < data.endDate;
    },
    {
      message: "Start date must be before end date",
      path: ["endDate"],
    },
  );

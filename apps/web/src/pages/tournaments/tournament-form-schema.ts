import { z } from "zod";

export const tournamentFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    sportType: z.string().trim().min(2, "Sport type must be at least 2 characters"),
    format: z.enum(["ROUND_ROBIN", "KNOCKOUT"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    description: z.string().trim().optional(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

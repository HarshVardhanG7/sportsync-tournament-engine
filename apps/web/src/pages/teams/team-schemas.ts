import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters"),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const playerFormSchema = z.object({
  name: z.string().trim().min(2, "Player name must be at least 2 characters"),
  jerseyNumber: z
    .string()
    .optional()
    .refine((value) => !value || Number.isInteger(Number(value)), {
      message: "Jersey number must be a whole number",
    })
    .refine((value) => !value || Number(value) > 0, {
      message: "Jersey number must be positive",
    }),
  position: z.string().trim().optional(),
});

export type PlayerFormValues = z.infer<typeof playerFormSchema>;

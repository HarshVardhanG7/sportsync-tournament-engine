import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateParams } from "../../middlewares/validate-request.js";
import { qualificationController } from "./qualification.controller.js";
import { qualificationTournamentParamsSchema } from "./qualification.validation.js";

export const qualificationRoutes = Router();

qualificationRoutes.use(authenticate);

qualificationRoutes.post(
  "/:tournamentId/qualifications/generate",
  requireRole(Role.ORGANIZER),
  validateParams(qualificationTournamentParamsSchema),
  qualificationController.generate,
);
qualificationRoutes.get(
  "/:tournamentId/qualifications",
  validateParams(qualificationTournamentParamsSchema),
  qualificationController.getByTournament,
);

import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateParams } from "../../middlewares/validate-request.js";
import { standingController } from "./standing.controller.js";
import { standingTournamentParamsSchema } from "./standing.validation.js";

export const standingRoutes = Router();

standingRoutes.use(authenticate);

standingRoutes.get(
  "/:tournamentId/standings",
  validateParams(standingTournamentParamsSchema),
  standingController.getByTournament,
);
standingRoutes.post(
  "/:tournamentId/standings/recalculate",
  requireRole(Role.ORGANIZER),
  validateParams(standingTournamentParamsSchema),
  standingController.recalculate,
);

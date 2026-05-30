import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateBody, validateParams } from "../../middlewares/validate-request.js";
import { matchController } from "./match.controller.js";
import {
  matchIdParamsSchema,
  matchTournamentParamsSchema,
  updateMatchScoreSchema,
} from "./match.validation.js";

export const tournamentMatchRoutes = Router();
export const matchRoutes = Router();

tournamentMatchRoutes.use(authenticate);
matchRoutes.use(authenticate);

tournamentMatchRoutes.get(
  "/:tournamentId/matches",
  validateParams(matchTournamentParamsSchema),
  matchController.getByTournament,
);

matchRoutes.get("/:matchId", validateParams(matchIdParamsSchema), matchController.getById);
matchRoutes.patch(
  "/:matchId/score",
  requireRole(Role.ORGANIZER),
  validateParams(matchIdParamsSchema),
  validateBody(updateMatchScoreSchema),
  matchController.updateScore,
);

import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateBody, validateParams } from "../../middlewares/validate-request.js";
import { teamController } from "./team.controller.js";
import {
  createTeamSchema,
  teamIdParamsSchema,
  tournamentTeamsParamsSchema,
  updateTeamSchema,
} from "./team.validation.js";

export const tournamentTeamRoutes = Router();
export const teamRoutes = Router();

tournamentTeamRoutes.use(authenticate);
teamRoutes.use(authenticate);

tournamentTeamRoutes.post(
  "/:tournamentId/teams",
  requireRole(Role.ORGANIZER),
  validateParams(tournamentTeamsParamsSchema),
  validateBody(createTeamSchema),
  teamController.create,
);
tournamentTeamRoutes.get(
  "/:tournamentId/teams",
  validateParams(tournamentTeamsParamsSchema),
  teamController.getByTournament,
);

teamRoutes.get("/:teamId", validateParams(teamIdParamsSchema), teamController.getById);
teamRoutes.patch(
  "/:teamId",
  requireRole(Role.ORGANIZER),
  validateParams(teamIdParamsSchema),
  validateBody(updateTeamSchema),
  teamController.update,
);
teamRoutes.delete(
  "/:teamId",
  requireRole(Role.ORGANIZER),
  validateParams(teamIdParamsSchema),
  teamController.softDelete,
);

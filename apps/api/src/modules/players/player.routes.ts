import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateBody, validateParams } from "../../middlewares/validate-request.js";
import { playerController } from "./player.controller.js";
import {
  createPlayerSchema,
  playerIdParamsSchema,
  teamPlayersParamsSchema,
  updatePlayerSchema,
} from "./player.validation.js";

export const teamPlayerRoutes = Router();
export const playerRoutes = Router();

teamPlayerRoutes.use(authenticate);
playerRoutes.use(authenticate);

teamPlayerRoutes.post(
  "/:teamId/players",
  requireRole(Role.ORGANIZER),
  validateParams(teamPlayersParamsSchema),
  validateBody(createPlayerSchema),
  playerController.create,
);
teamPlayerRoutes.get("/:teamId/players", validateParams(teamPlayersParamsSchema), playerController.getByTeam);

playerRoutes.get("/:playerId", validateParams(playerIdParamsSchema), playerController.getById);
playerRoutes.patch(
  "/:playerId",
  requireRole(Role.ORGANIZER),
  validateParams(playerIdParamsSchema),
  validateBody(updatePlayerSchema),
  playerController.update,
);
playerRoutes.delete(
  "/:playerId",
  requireRole(Role.ORGANIZER),
  validateParams(playerIdParamsSchema),
  playerController.softDelete,
);

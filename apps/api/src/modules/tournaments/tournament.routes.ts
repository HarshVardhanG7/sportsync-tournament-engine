import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateBody, validateParams } from "../../middlewares/validate-request.js";
import { tournamentController } from "./tournament.controller.js";
import {
  createTournamentSchema,
  tournamentIdParamsSchema,
  updateTournamentSchema,
} from "./tournament.validation.js";

export const tournamentRoutes = Router();

tournamentRoutes.use(authenticate);

tournamentRoutes.post(
  "/",
  requireRole(Role.ORGANIZER),
  validateBody(createTournamentSchema),
  tournamentController.create,
);
tournamentRoutes.get("/my", requireRole(Role.ORGANIZER), tournamentController.getMyTournaments);
tournamentRoutes.get(
  "/:id",
  validateParams(tournamentIdParamsSchema),
  tournamentController.getById,
);
tournamentRoutes.patch(
  "/:id",
  requireRole(Role.ORGANIZER),
  validateParams(tournamentIdParamsSchema),
  validateBody(updateTournamentSchema),
  tournamentController.update,
);
tournamentRoutes.delete(
  "/:id",
  requireRole(Role.ORGANIZER),
  validateParams(tournamentIdParamsSchema),
  tournamentController.softDelete,
);
tournamentRoutes.patch(
  "/:id/publish",
  requireRole(Role.ORGANIZER),
  validateParams(tournamentIdParamsSchema),
  tournamentController.publish,
);
tournamentRoutes.patch(
  "/:id/complete",
  requireRole(Role.ORGANIZER),
  validateParams(tournamentIdParamsSchema),
  tournamentController.complete,
);

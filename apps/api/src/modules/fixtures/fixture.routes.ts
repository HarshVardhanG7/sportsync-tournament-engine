import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { validateParams } from "../../middlewares/validate-request.js";
import { fixtureController } from "./fixture.controller.js";
import { fixtureTournamentParamsSchema } from "./fixture.validation.js";

export const fixtureRoutes = Router();

fixtureRoutes.use(authenticate);

fixtureRoutes.post(
  "/:tournamentId/fixtures/generate",
  requireRole(Role.ORGANIZER),
  validateParams(fixtureTournamentParamsSchema),
  fixtureController.generate,
);
fixtureRoutes.get(
  "/:tournamentId/fixtures",
  validateParams(fixtureTournamentParamsSchema),
  fixtureController.getByTournament,
);

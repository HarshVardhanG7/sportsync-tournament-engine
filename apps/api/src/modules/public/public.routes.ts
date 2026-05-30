import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { validateParams } from "../../middlewares/validate-request.js";
import { publicController } from "./public.controller.js";
import {
  publicTournamentQuerySchema,
  publicTournamentSlugParamsSchema,
} from "./public.validation.js";

function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.query = schema.parse(req.query) as Request["query"];
    next();
  };
}

export const publicRoutes = Router();

publicRoutes.get("/tournaments", validateQuery(publicTournamentQuerySchema), publicController.listTournaments);
publicRoutes.get(
  "/tournaments/:slug",
  validateParams(publicTournamentSlugParamsSchema),
  publicController.getTournament,
);
publicRoutes.get(
  "/tournaments/:slug/teams",
  validateParams(publicTournamentSlugParamsSchema),
  publicController.getTeams,
);
publicRoutes.get(
  "/tournaments/:slug/matches",
  validateParams(publicTournamentSlugParamsSchema),
  publicController.getMatches,
);
publicRoutes.get(
  "/tournaments/:slug/standings",
  validateParams(publicTournamentSlugParamsSchema),
  publicController.getStandings,
);

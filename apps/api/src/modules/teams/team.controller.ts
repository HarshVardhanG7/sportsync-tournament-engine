import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { teamService } from "./team.service.js";
import type { TeamIdParams, TournamentTeamsParams } from "./team.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const teamController = {
  create: asyncHandler(async (req, res) => {
    const data = await teamService.create(
      req.params as TournamentTeamsParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data, 201);
  }),

  getByTournament: asyncHandler(async (req, res) => {
    const data = await teamService.getByTournament(
      req.params as TournamentTeamsParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  getById: asyncHandler(async (req, res) => {
    const data = await teamService.getById(req.params as TeamIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),

  update: asyncHandler(async (req, res) => {
    const data = await teamService.update(
      req.params as TeamIdParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const data = await teamService.softDelete(req.params as TeamIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),
};

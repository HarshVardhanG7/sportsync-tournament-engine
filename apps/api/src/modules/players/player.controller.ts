import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { playerService } from "./player.service.js";
import type { PlayerIdParams, TeamPlayersParams } from "./player.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const playerController = {
  create: asyncHandler(async (req, res) => {
    const data = await playerService.create(
      req.params as TeamPlayersParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data, 201);
  }),

  getByTeam: asyncHandler(async (req, res) => {
    const data = await playerService.getByTeam(req.params as TeamPlayersParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),

  getById: asyncHandler(async (req, res) => {
    const data = await playerService.getById(req.params as PlayerIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),

  update: asyncHandler(async (req, res) => {
    const data = await playerService.update(
      req.params as PlayerIdParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const data = await playerService.softDelete(req.params as PlayerIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),
};

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { tournamentService } from "./tournament.service.js";
import type { TournamentIdParams } from "./tournament.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const tournamentController = {
  create: asyncHandler(async (req, res) => {
    const data = await tournamentService.create(req.body, requireUser(req.user));
    return sendSuccess(res, data, 201);
  }),

  getMyTournaments: asyncHandler(async (req, res) => {
    const data = await tournamentService.getMyTournaments(requireUser(req.user));
    return sendSuccess(res, data);
  }),

  getById: asyncHandler(async (req, res) => {
    const data = await tournamentService.getById(req.params as TournamentIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),

  update: asyncHandler(async (req, res) => {
    const data = await tournamentService.update(
      req.params as TournamentIdParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const data = await tournamentService.softDelete(
      req.params as TournamentIdParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  publish: asyncHandler(async (req, res) => {
    const data = await tournamentService.publish(
      req.params as TournamentIdParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  complete: asyncHandler(async (req, res) => {
    const data = await tournamentService.complete(
      req.params as TournamentIdParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),
};

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { matchService } from "./match.service.js";
import type { MatchIdParams, MatchTournamentParams } from "./match.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const matchController = {
  getByTournament: asyncHandler(async (req, res) => {
    const data = await matchService.getByTournament(
      req.params as MatchTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  getById: asyncHandler(async (req, res) => {
    const data = await matchService.getById(req.params as MatchIdParams, requireUser(req.user));
    return sendSuccess(res, data);
  }),

  updateScore: asyncHandler(async (req, res) => {
    const data = await matchService.updateScore(
      req.params as MatchIdParams,
      req.body,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),
};

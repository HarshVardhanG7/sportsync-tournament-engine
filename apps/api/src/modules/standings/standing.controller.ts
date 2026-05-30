import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { standingService } from "./standing.service.js";
import type { StandingTournamentParams } from "./standing.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const standingController = {
  getByTournament: asyncHandler(async (req, res) => {
    const data = await standingService.getByTournament(
      req.params as StandingTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),

  recalculate: asyncHandler(async (req, res) => {
    const data = await standingService.recalculate(
      req.params as StandingTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),
};

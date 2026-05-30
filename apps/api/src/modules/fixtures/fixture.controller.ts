import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { fixtureService } from "./fixture.service.js";
import type { FixtureTournamentParams } from "./fixture.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const fixtureController = {
  generate: asyncHandler(async (req, res) => {
    const data = await fixtureService.generate(
      req.params as FixtureTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data, 201);
  }),

  getByTournament: asyncHandler(async (req, res) => {
    const data = await fixtureService.getByTournament(
      req.params as FixtureTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),
};

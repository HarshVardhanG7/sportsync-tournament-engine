import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { qualificationService } from "./qualification.service.js";
import type { QualificationTournamentParams } from "./qualification.types.js";

function requireUser(user: Express.User | undefined) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

export const qualificationController = {
  generate: asyncHandler(async (req, res) => {
    const data = await qualificationService.generate(
      req.params as QualificationTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data, 201);
  }),

  getByTournament: asyncHandler(async (req, res) => {
    const data = await qualificationService.getByTournament(
      req.params as QualificationTournamentParams,
      requireUser(req.user),
    );
    return sendSuccess(res, data);
  }),
};

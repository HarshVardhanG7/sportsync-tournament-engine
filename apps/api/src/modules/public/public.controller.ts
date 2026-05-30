import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { publicService } from "./public.service.js";
import type { PublicTournamentQuery, PublicTournamentSlugParams } from "./public.types.js";

export const publicController = {
  listTournaments: asyncHandler(async (req, res) => {
    const data = await publicService.listTournaments(req.query as unknown as PublicTournamentQuery);
    return sendSuccess(res, data);
  }),

  getTournament: asyncHandler(async (req, res) => {
    const data = await publicService.getTournament(req.params as PublicTournamentSlugParams);
    return sendSuccess(res, data);
  }),

  getTeams: asyncHandler(async (req, res) => {
    const data = await publicService.getTeams(req.params as PublicTournamentSlugParams);
    return sendSuccess(res, data);
  }),

  getMatches: asyncHandler(async (req, res) => {
    const data = await publicService.getMatches(req.params as PublicTournamentSlugParams);
    return sendSuccess(res, data);
  }),

  getStandings: asyncHandler(async (req, res) => {
    const data = await publicService.getStandings(req.params as PublicTournamentSlugParams);
    return sendSuccess(res, data);
  }),
};

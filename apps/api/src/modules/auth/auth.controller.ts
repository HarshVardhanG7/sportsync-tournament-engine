import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authService } from "./auth.service.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return sendSuccess(res, data, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return sendSuccess(res, data);
  }),

  refresh: asyncHandler(async (req, res) => {
    const data = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, data);
  }),

  logout: asyncHandler(async (req, res) => {
    const data = await authService.logout(req.body.refreshToken);
    return sendSuccess(res, data);
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    return sendSuccess(res, authService.getCurrentUser(req.user));
  }),
};

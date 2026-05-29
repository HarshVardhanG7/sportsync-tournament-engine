import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validateBody } from "../../middlewares/validate-request.js";
import { authController } from "./auth.controller.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), authController.register);
authRoutes.post("/login", validateBody(loginSchema), authController.login);
authRoutes.post("/refresh", validateBody(refreshSchema), authController.refresh);
authRoutes.post("/logout", validateBody(logoutSchema), authController.logout);
authRoutes.get("/me", authenticate, authController.me);

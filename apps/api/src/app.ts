import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AppError } from "./utils/app-error.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1/auth", authRoutes);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorHandler);

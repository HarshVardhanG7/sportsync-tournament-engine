import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { fixtureRoutes } from "./modules/fixtures/fixture.routes.js";
import { matchRoutes, tournamentMatchRoutes } from "./modules/matches/match.routes.js";
import { playerRoutes, teamPlayerRoutes } from "./modules/players/player.routes.js";
import { standingRoutes } from "./modules/standings/standing.routes.js";
import { teamRoutes, tournamentTeamRoutes } from "./modules/teams/team.routes.js";
import { tournamentRoutes } from "./modules/tournaments/tournament.routes.js";
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
app.use("/api/v1/tournaments", tournamentRoutes);
app.use("/api/v1/tournaments", tournamentTeamRoutes);
app.use("/api/v1/tournaments", fixtureRoutes);
app.use("/api/v1/tournaments", tournamentMatchRoutes);
app.use("/api/v1/tournaments", standingRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/teams", teamPlayerRoutes);
app.use("/api/v1/players", playerRoutes);
app.use("/api/v1/matches", matchRoutes);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorHandler);

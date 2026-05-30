import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/routes/ProtectedRoute";
import { PublicRoute } from "../components/routes/PublicRoute";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { TournamentFixturesPage } from "../pages/fixtures/TournamentFixturesPage";
import { TournamentPlayoffsPage } from "../pages/playoffs/TournamentPlayoffsPage";
import { PublicTournamentDetailsPage } from "../pages/public/PublicTournamentDetailsPage";
import { PublicTournamentsPage } from "../pages/public/PublicTournamentsPage";
import { TournamentStandingsPage } from "../pages/standings/TournamentStandingsPage";
import { TeamDetailsPage } from "../pages/teams/TeamDetailsPage";
import { TournamentTeamsPage } from "../pages/teams/TournamentTeamsPage";
import { CreateTournamentPage } from "../pages/tournaments/CreateTournamentPage";
import { MyTournamentsPage } from "../pages/tournaments/MyTournamentsPage";
import { TournamentDetailsPage } from "../pages/tournaments/TournamentDetailsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/tournaments" element={<PublicTournamentsPage />} />
      <Route path="/tournaments/:slug" element={<PublicTournamentDetailsPage />} />
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/tournaments" element={<MyTournamentsPage />} />
          <Route path="/dashboard/tournaments/new" element={<CreateTournamentPage />} />
          <Route path="/dashboard/tournaments/:id" element={<TournamentDetailsPage />} />
          <Route path="/dashboard/tournaments/:id/teams" element={<TournamentTeamsPage />} />
          <Route path="/dashboard/tournaments/:id/fixtures" element={<TournamentFixturesPage />} />
          <Route path="/dashboard/tournaments/:id/standings" element={<TournamentStandingsPage />} />
          <Route path="/dashboard/tournaments/:id/playoffs" element={<TournamentPlayoffsPage />} />
          <Route path="/dashboard/teams/:teamId" element={<TeamDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/routes/ProtectedRoute";
import { PublicRoute } from "../components/routes/PublicRoute";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { CreateTournamentPage } from "../pages/tournaments/CreateTournamentPage";
import { MyTournamentsPage } from "../pages/tournaments/MyTournamentsPage";
import { TournamentDetailsPage } from "../pages/tournaments/TournamentDetailsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

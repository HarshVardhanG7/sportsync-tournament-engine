import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LayoutDashboard, ListOrdered, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getMyTournaments } from "../../services/tournaments";

export function SidebarNavigation() {
  const location = useLocation();
  const tournamentsQuery = useQuery({
    queryKey: ["tournaments", "my"],
    queryFn: getMyTournaments,
  });
  const currentTournamentId = getTournamentIdFromPath(location.pathname);
  const fallbackTournamentId = tournamentsQuery.data?.[0]?.id;
  const navigationTournamentId = currentTournamentId ?? fallbackTournamentId;
  const tournamentScopedHref = (section: "teams" | "fixtures" | "standings") =>
    navigationTournamentId
      ? `/dashboard/tournaments/${navigationTournamentId}/${section}`
      : "/dashboard/tournaments";

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "overview" },
    { label: "Tournaments", href: "/dashboard/tournaments", icon: Trophy, section: "tournaments" },
    { label: "Teams", href: tournamentScopedHref("teams"), icon: Users, section: "teams" },
    { label: "Fixtures", href: tournamentScopedHref("fixtures"), icon: CalendarDays, section: "fixtures" },
    { label: "Standings", href: tournamentScopedHref("standings"), icon: ListOrdered, section: "standings" },
  ];

  return (
    <aside className="hidden min-h-screen w-60 shrink-0 border-r border-slate-200 bg-white md:block xl:w-64">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">SportSync</p>
          <p className="text-xs text-slate-500">Tournament Engine</p>
        </div>
      </div>
      <nav className="grid gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getActiveSection(location.pathname) === item.section;

          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function getActiveSection(pathname: string) {
  if (pathname === "/dashboard") {
    return "overview";
  }

  if (pathname.includes("/teams")) {
    return "teams";
  }

  if (pathname.includes("/fixtures") || pathname.includes("/playoffs")) {
    return "fixtures";
  }

  if (pathname.includes("/standings")) {
    return "standings";
  }

  return "tournaments";
}

function getTournamentIdFromPath(pathname: string) {
  const match = pathname.match(/^\/dashboard\/tournaments\/([^/]+)/);
  const tournamentId = match?.[1];

  if (!tournamentId || tournamentId === "new") {
    return null;
  }

  return tournamentId;
}

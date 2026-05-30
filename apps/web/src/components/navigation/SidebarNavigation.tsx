import {
  CalendarDays,
  GitBranch,
  LayoutDashboard,
  ListOrdered,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const primaryNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "overview" },
  { label: "Tournaments", href: "/dashboard/tournaments", icon: Trophy, section: "tournaments" },
];

const tournamentScopedItems = [
  { label: "Teams", path: "teams", icon: Users, section: "teams" },
  { label: "Fixtures", path: "fixtures", icon: CalendarDays, section: "fixtures" },
  { label: "Standings", path: "standings", icon: ListOrdered, section: "standings" },
  { label: "Playoffs", path: "playoffs", icon: GitBranch, section: "playoffs" },
];

export function SidebarNavigation() {
  const location = useLocation();
  const pathname = location.pathname;
  const match = pathname.match(/^\/dashboard\/tournaments\/([^/]+)/);
  const selectedTournamentId = match?.[1];

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
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = getActiveSection(pathname) === item.section;

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

        {selectedTournamentId ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid gap-1">
              {tournamentScopedItems.map((item) => {
                const Icon = item.icon;
                const isActive = getActiveSection(pathname) === item.section;

                return (
                  <Link
                    key={item.label}
                    to={`/dashboard/tournaments/${selectedTournamentId}/${item.path}`}
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
            </div>
          </div>
        ) : null}
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

  if (pathname.includes("/fixtures")) {
    return "fixtures";
  }

  if (pathname.includes("/standings")) {
    return "standings";
  }

  if (pathname.includes("/playoffs")) {
    return "playoffs";
  }

  return "tournaments";
}

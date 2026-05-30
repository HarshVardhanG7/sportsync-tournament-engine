import { CalendarDays, LayoutDashboard, ListOrdered, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const primaryNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "overview" },
  { label: "Tournaments", href: "/dashboard/tournaments", icon: Trophy, section: "tournaments" },
];

const tournamentScopedItems = [
  { label: "Teams", icon: Users },
  { label: "Fixtures", icon: CalendarDays },
  { label: "Standings", icon: ListOrdered },
];

export function SidebarNavigation() {
  const location = useLocation();

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
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Tournament Tools
          </p>
          <div className="mt-2 grid gap-1">
            {tournamentScopedItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  title="Select a tournament first"
                  aria-disabled="true"
                  className="flex min-h-12 cursor-not-allowed items-start gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 opacity-50"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="leading-5">{item.label}</p>
                    <p className="text-xs font-normal leading-4 text-slate-500">
                      Select a tournament first
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}

function getActiveSection(pathname: string) {
  if (pathname === "/dashboard") {
    return "overview";
  }

  return "tournaments";
}

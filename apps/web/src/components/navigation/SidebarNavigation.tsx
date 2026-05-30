import { CalendarDays, LayoutDashboard, ShieldCheck, Trophy, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tournaments", href: "/dashboard", icon: Trophy },
  { label: "Teams", href: "/dashboard", icon: Users },
  { label: "Schedule", href: "/dashboard", icon: CalendarDays },
];

export function SidebarNavigation() {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white lg:block">
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

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === "/dashboard"}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

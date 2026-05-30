import { Activity, CalendarCheck, Trophy, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const stats = [
  { label: "Tournament workspace", value: "Ready", icon: Trophy },
  { label: "Team operations", value: "Prepared", icon: Users },
  { label: "Fixture engine", value: "Online", icon: CalendarCheck },
  { label: "API health", value: "Connected", icon: Activity },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">{user?.role}</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Welcome, {user?.name ?? "there"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Your SportSync frontend foundation is connected to the authentication API and ready for
          tournament management workflows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-950">{stat.value}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

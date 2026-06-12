import { Outlet } from "react-router-dom";

const standingsPreview = [
  { rank: 1, team: "Warriors", points: 9 },
  { rank: 2, team: "Titans", points: 6 },
  { rank: 3, team: "Kings", points: 3 },
];

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden bg-[#07111f] px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.20),transparent_28%),radial-gradient(circle_at_82%_46%,rgba(45,212,191,0.13),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0),rgba(2,6,23,0.45))]" />
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              SportSync
            </p>
            <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight tracking-normal">
              Tournament operations without spreadsheets.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Build fixtures, publish schedules, update scores, and keep standings reliable from
              one focused workspace.
            </p>
          </div>

          <CommandCenterPreview />

          <div className="relative z-10 grid grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">15m</p>
              <p>secure access sessions</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">7d</p>
              <p>refresh token window</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">RBAC</p>
              <p>organizer and captain roles</p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

function CommandCenterPreview() {
  return (
    <div className="relative z-10 my-8 max-w-3xl">
      <div className="auth-float-slow rounded-2xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Sample Tournament Command Center</p>
            <p className="mt-1 text-xs text-slate-400">SNIST Cricket Championship</p>
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Demo data
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Illustrative preview only. These teams, fixtures, and standings are not from a live account.
        </p>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <PreviewCard className="auth-float-medium">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Upcoming Match
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <TeamBadge name="Warriors" />
              <span className="text-xs font-semibold text-slate-500">VS</span>
              <TeamBadge name="Titans" />
            </div>
            <p className="mt-4 text-sm font-medium text-emerald-200">Today · 6:00 PM</p>
          </PreviewCard>

          <div className="grid gap-4">
            <PreviewCard className="auth-float-fast">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Fixtures
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">6</p>
              <p className="text-sm text-slate-300">fixtures generated</p>
            </PreviewCard>

            <PreviewCard className="auth-float-medium [animation-delay:0.8s]">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Status
              </p>
              <p className="mt-3 text-sm font-semibold text-white">Round Robin · Published</p>
            </PreviewCard>
          </div>
        </div>

        <PreviewCard className="auth-float-slow mt-4 [animation-delay:1s]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Points Table
            </p>
            <span className="text-xs font-semibold text-emerald-200">Sample</span>
          </div>
          <div className="mt-3 grid gap-2">
            {standingsPreview.map((standing) => (
              <div
                key={standing.team}
                className="grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-emerald-200">{standing.rank}</span>
                <span className="font-medium text-white">{standing.team}</span>
                <span className="text-slate-300">{standing.points} pts</span>
              </div>
            ))}
          </div>
        </PreviewCard>
      </div>
    </div>
  );
}

function PreviewCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-xl border border-white/10 bg-slate-950/40 p-4 shadow-xl shadow-slate-950/25 backdrop-blur-md ${className}`}>
      {children}
    </article>
  );
}

function TeamBadge({ name }: { name: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-3 text-center">
      <p className="truncate text-sm font-semibold text-white">{name}</p>
    </div>
  );
}

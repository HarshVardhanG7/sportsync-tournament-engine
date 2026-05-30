import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden bg-slate-900 px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
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
          <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
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

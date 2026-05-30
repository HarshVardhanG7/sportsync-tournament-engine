import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Plus, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../services/api";
import { getMyTournaments } from "../../services/tournaments";
import { formatDate, formatFormat, StatusBadge } from "./tournament-ui";

export function MyTournamentsPage() {
  const tournamentsQuery = useQuery({
    queryKey: ["tournaments", "my"],
    queryFn: getMyTournaments,
  });

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Tournament Management</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">My tournaments</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create, publish, and monitor tournaments you own.
          </p>
        </div>
        <Link
          to="/dashboard/tournaments/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Tournament
        </Link>
      </section>

      {tournamentsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading tournaments...
        </div>
      ) : null}

      {tournamentsQuery.isError ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getApiErrorMessage(tournamentsQuery.error)}</span>
        </div>
      ) : null}

      {tournamentsQuery.data?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Trophy className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No tournaments yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Start by creating your first tournament workspace.
          </p>
          <Link
            to="/dashboard/tournaments/new"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Create Tournament
          </Link>
        </div>
      ) : null}

      {tournamentsQuery.data && tournamentsQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tournament</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tournamentsQuery.data.map((tournament) => (
                  <tr key={tournament.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{tournament.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{tournament.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{tournament.sportType}</td>
                    <td className="px-4 py-4 text-slate-700">{formatFormat(tournament.format)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/dashboard/tournaments/${tournament.id}`}
                        className="font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

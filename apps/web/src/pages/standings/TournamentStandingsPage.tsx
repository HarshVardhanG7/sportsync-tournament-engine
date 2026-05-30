import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../services/api";
import { getStandings, recalculateStandings } from "../../services/standings";
import { getTournament } from "../../services/tournaments";

export function TournamentStandingsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const tournamentQuery = useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => getTournament(id ?? ""),
    enabled: Boolean(id),
  });
  const standingsQuery = useQuery({
    queryKey: ["standings", id],
    queryFn: () => getStandings(id ?? ""),
    enabled: Boolean(id),
  });
  const recalculateMutation = useMutation({
    mutationFn: () => recalculateStandings(id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["standings", id] });
    },
  });
  const error = standingsQuery.error ?? recalculateMutation.error;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={`/dashboard/tournaments/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to tournament
          </Link>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            {tournamentQuery.data?.name ?? "Tournament"} standings
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review the points table generated from completed matches.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {recalculateMutation.isPending ? "Recalculating..." : "Recalculate Standings"}
        </Button>
      </div>

      {error ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getApiErrorMessage(error)}</span>
        </div>
      ) : null}

      {standingsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading standings...
        </div>
      ) : null}

      {standingsQuery.data?.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Trophy className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No standings yet</h3>
          <p className="mt-2 text-sm text-slate-600">Complete match scores to generate the points table.</p>
        </section>
      ) : null}

      {standingsQuery.data && standingsQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Played</th>
                  <th className="px-4 py-3">Won</th>
                  <th className="px-4 py-3">Lost</th>
                  <th className="px-4 py-3">Drawn</th>
                  <th className="px-4 py-3">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standingsQuery.data.map((standing) => (
                  <tr key={standing.team?.id ?? standing.rank} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-950">{standing.rank ?? "—"}</td>
                    <td className="px-4 py-4 font-medium text-slate-950">{standing.team?.name ?? "Team"}</td>
                    <td className="px-4 py-4 text-slate-700">{standing.played}</td>
                    <td className="px-4 py-4 text-slate-700">{standing.won}</td>
                    <td className="px-4 py-4 text-slate-700">{standing.lost}</td>
                    <td className="px-4 py-4 text-slate-700">{standing.drawn}</td>
                    <td className="px-4 py-4 text-base font-semibold text-emerald-700">{standing.points}</td>
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

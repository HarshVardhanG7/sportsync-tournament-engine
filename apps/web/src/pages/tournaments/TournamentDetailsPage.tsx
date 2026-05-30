import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, Send, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../services/api";
import {
  completeTournament,
  deleteTournament,
  getTournament,
  publishTournament,
} from "../../services/tournaments";
import { formatDate, formatFormat, StatusBadge } from "./tournament-ui";

export function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tournamentQuery = useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => getTournament(id ?? ""),
    enabled: Boolean(id),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishTournament(id ?? ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournaments", id] }),
        queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] }),
      ]);
    },
  });
  const completeMutation = useMutation({
    mutationFn: () => completeTournament(id ?? ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournaments", id] }),
        queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] }),
      ]);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteTournament(id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] });
      navigate("/dashboard/tournaments");
    },
  });

  const mutationError =
    publishMutation.error ?? completeMutation.error ?? deleteMutation.error ?? tournamentQuery.error;
  const tournament = tournamentQuery.data;

  function handleDelete() {
    if (window.confirm("Delete this tournament? This will hide it from your dashboard.")) {
      deleteMutation.mutate();
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to="/dashboard/tournaments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tournaments
        </Link>
      </div>

      {tournamentQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading tournament...
        </div>
      ) : null}

      {mutationError ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getApiErrorMessage(mutationError)}</span>
        </div>
      ) : null}

      {tournament ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-slate-950">{tournament.name}</h2>
                  <StatusBadge status={tournament.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">Slug: {tournament.slug}</p>
                {tournament.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                    {tournament.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => publishMutation.mutate()}
                  disabled={tournament.status !== "DRAFT" || publishMutation.isPending}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => completeMutation.mutate()}
                  disabled={
                    !["PUBLISHED", "ONGOING"].includes(tournament.status) || completeMutation.isPending
                  }
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Complete
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={tournament.status === "COMPLETED" || deleteMutation.isPending}
                  className="text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailCard label="Sport" value={tournament.sportType} />
            <DetailCard label="Format" value={formatFormat(tournament.format)} />
            <DetailCard
              label="Dates"
              value={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
            />
            <DetailCard
              label="Setup"
              value={`${tournament._count?.teams ?? 0} teams, ${tournament._count?.matches ?? 0} matches`}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </article>
  );
}

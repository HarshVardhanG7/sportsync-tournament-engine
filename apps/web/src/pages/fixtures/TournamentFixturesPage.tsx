import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ListPlus, Pencil, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { getApiErrorMessage } from "../../services/api";
import { generateFixtures, getFixtures } from "../../services/fixtures";
import { updateMatchScore } from "../../services/matches";
import { getTournament } from "../../services/tournaments";
import type { Match } from "../../types/match";
import { MatchStatusBadge, StageBadge } from "./fixture-ui";
import { scoreFormSchema, type ScoreFormValues } from "./score-schema";

export function TournamentFixturesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tournamentQuery = useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => getTournament(id ?? ""),
    enabled: Boolean(id),
  });
  const fixturesQuery = useQuery({
    queryKey: ["fixtures", id],
    queryFn: () => getFixtures(id ?? ""),
    enabled: Boolean(id),
  });
  const form = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreFormSchema),
    defaultValues: { teamAScore: 0, teamBScore: 0 },
  });

  const invalidateMatchData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["fixtures", id] }),
      queryClient.invalidateQueries({ queryKey: ["standings", id] }),
      queryClient.invalidateQueries({ queryKey: ["tournaments", id] }),
    ]);
  };

  const generateMutation = useMutation({
    mutationFn: () => generateFixtures(id ?? ""),
    onSuccess: async () => {
      setFeedback("Fixtures generated.");
      setError(null);
      await invalidateMatchData();
    },
    onError: (caughtError) => {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError));
    },
  });

  const scoreMutation = useMutation({
    mutationFn: (values: ScoreFormValues) => updateMatchScore(editingMatch?.id ?? "", values),
    onSuccess: async () => {
      setFeedback("Score updated.");
      setError(null);
      setEditingMatch(null);
      await invalidateMatchData();
    },
    onError: (caughtError) => {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError));
    },
  });

  function startScoreEdit(match: Match) {
    setFeedback(null);
    setError(null);
    setEditingMatch(match);
    form.reset({
      teamAScore: match.teamAScore ?? 0,
      teamBScore: match.teamBScore ?? 0,
    });
  }

  function onSubmit(values: ScoreFormValues) {
    scoreMutation.mutate(values);
  }

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
            {tournamentQuery.data?.name ?? "Tournament"} fixtures
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate fixtures and update match scores from one matchboard.
          </p>
        </div>
        <Button type="button" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <ListPlus className="h-4 w-4" aria-hidden="true" />
          {generateMutation.isPending ? "Generating..." : "Generate Fixtures"}
        </Button>
      </div>

      {error ? <Message tone="error" message={error} /> : null}
      {feedback ? <Message tone="success" message={feedback} /> : null}
      {fixturesQuery.isError ? <Message tone="error" message={getApiErrorMessage(fixturesQuery.error)} /> : null}

      {editingMatch ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">
            Update score: {editingMatch.teamA?.name} vs {editingMatch.teamB?.name}
          </h3>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={form.handleSubmit(onSubmit)}>
            <TextField
              label={editingMatch.teamA?.name ?? "Team A"}
              type="number"
              min={0}
              error={form.formState.errors.teamAScore?.message}
              {...form.register("teamAScore")}
            />
            <TextField
              label={editingMatch.teamB?.name ?? "Team B"}
              type="number"
              min={0}
              error={form.formState.errors.teamBScore?.message}
              {...form.register("teamBScore")}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingMatch(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scoreMutation.isPending}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Score
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {fixturesQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading fixtures...
        </div>
      ) : null}

      {fixturesQuery.data?.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <ListPlus className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No fixtures yet</h3>
          <p className="mt-2 text-sm text-slate-600">Generate fixtures after adding teams.</p>
        </section>
      ) : null}

      {fixturesQuery.data && fixturesQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Winner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixturesQuery.data.map((match) => (
                  <tr key={match.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-950">{match.matchNumber}</td>
                    <td className="px-4 py-4">
                      <StageBadge stage={match.stage} />
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <span className={match.winnerTeamId === match.teamAId ? "font-semibold text-emerald-700" : ""}>
                        {match.teamA?.name ?? "Team A"}
                      </span>{" "}
                      <span className="text-slate-400">vs</span>{" "}
                      <span className={match.winnerTeamId === match.teamBId ? "font-semibold text-emerald-700" : ""}>
                        {match.teamB?.name ?? "Team B"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {match.teamAScore ?? "—"} - {match.teamBScore ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{match.winnerTeam?.name ?? "—"}</td>
                    <td className="px-4 py-4">
                      <MatchStatusBadge status={match.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button type="button" variant="secondary" onClick={() => startScoreEdit(match)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Score
                      </Button>
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

function Message({ message, tone }: { message: string; tone: "error" | "success" }) {
  const classes =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`flex gap-2 rounded-lg border p-4 text-sm ${classes}`}>
      {tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span>{message}</span>
    </div>
  );
}

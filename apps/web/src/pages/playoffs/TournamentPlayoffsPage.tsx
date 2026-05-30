import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, GitBranch, Sparkles, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../services/api";
import { generateQualifications, getQualifications } from "../../services/qualifications";
import { getTournament } from "../../services/tournaments";
import type { Match } from "../../types/match";
import { MatchStatusBadge, StageBadge, formatEnum } from "../fixtures/fixture-ui";
import { formatDate, StatusBadge } from "../tournaments/tournament-ui";

export function TournamentPlayoffsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const tournamentQuery = useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => getTournament(id ?? ""),
    enabled: Boolean(id),
  });

  const qualificationsQuery = useQuery({
    queryKey: ["qualifications", id],
    queryFn: () => getQualifications(id ?? ""),
    enabled: Boolean(id),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateQualifications(id ?? ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["qualifications", id] }),
        queryClient.invalidateQueries({ queryKey: ["tournaments", id] }),
        queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] }),
      ]);
    },
  });

  const matches = qualificationsQuery.data ?? [];
  const semiFinals = matches.filter((match) => match.stage === "SEMI_FINAL");
  const finalMatch = matches.find((match) => match.stage === "FINAL");
  const champion = finalMatch?.status === "COMPLETED" ? finalMatch.winnerTeam : null;
  const firstError = tournamentQuery.error ?? qualificationsQuery.error ?? generateMutation.error;

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to={`/dashboard/tournaments/${id ?? ""}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tournament
        </Link>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Playoff Management</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">
                {tournamentQuery.data?.name ?? "Tournament playoffs"}
              </h2>
              {tournamentQuery.data ? <StatusBadge status={tournamentQuery.data.status} /> : null}
            </div>
            {tournamentQuery.data ? (
              <p className="mt-2 text-sm text-slate-500">
                {tournamentQuery.data.sportType} · {formatDate(tournamentQuery.data.startDate)} -{" "}
                {formatDate(tournamentQuery.data.endDate)}
              </p>
            ) : null}
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Generate semi finals after league play, generate the final after semi finals, and declare the
              champion once the final score is completed.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !id}
            className="lg:w-44"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {generateMutation.isPending ? "Generating..." : "Generate Playoffs"}
          </Button>
        </div>
      </section>

      {firstError ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getApiErrorMessage(firstError)}</span>
        </div>
      ) : null}

      {tournamentQuery.isLoading || qualificationsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading playoff bracket...
        </div>
      ) : null}

      {champion ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            Tournament Champion
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-emerald-950">{champion.name}</h3>
        </section>
      ) : null}

      {!qualificationsQuery.isLoading && matches.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <GitBranch className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No playoff matches yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Complete all league matches and keep standings updated, then generate playoffs to create the
            semi-final bracket.
          </p>
        </section>
      ) : null}

      {matches.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[1fr_220px_1fr] xl:items-center">
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Semi Finals
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Top four qualifiers</h3>
              </div>
              {semiFinals.length > 0 ? (
                semiFinals.map((match, index) => (
                  <PlayoffMatchCard key={match.id} match={match} title={`Semi Final ${index + 1}`} />
                ))
              ) : (
                <EmptyBracketSlot label="Semi finals have not been generated." />
              )}
            </div>

            <div className="hidden h-px bg-slate-200 xl:block" aria-hidden="true" />

            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Final</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Championship match</h3>
              </div>
              {finalMatch ? (
                <PlayoffMatchCard match={finalMatch} title="Final" featured />
              ) : (
                <EmptyBracketSlot label="Complete both semi finals, then generate the final." />
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PlayoffMatchCard({
  match,
  title,
  featured = false,
}: {
  match: Match;
  title: string;
  featured?: boolean;
}) {
  const teamAIsWinner = match.winnerTeamId === match.teamAId || match.winnerTeam?.id === match.teamA?.id;
  const teamBIsWinner = match.winnerTeamId === match.teamBId || match.winnerTeam?.id === match.teamB?.id;

  return (
    <article
      className={`rounded-lg border p-5 shadow-sm ${
        featured ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs text-slate-500">Match #{match.matchNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StageBadge stage={match.stage} />
          <MatchStatusBadge status={match.status} />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <TeamScoreRow
          name={match.teamA?.name ?? "Team A"}
          score={match.teamAScore}
          isWinner={teamAIsWinner}
        />
        <TeamScoreRow
          name={match.teamB?.name ?? "Team B"}
          score={match.teamBScore}
          isWinner={teamBIsWinner}
        />
      </div>

      <div className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">Winner: </span>
        <span className="font-semibold text-slate-950">{match.winnerTeam?.name ?? "-"}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{formatEnum(match.stage)}</p>
    </article>
  );
}

function TeamScoreRow({
  name,
  score,
  isWinner,
}: {
  name: string;
  score?: number | null | undefined;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-3 ${
        isWinner ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <span className="font-medium">{name}</span>
      <span className="text-lg font-semibold">{score ?? "-"}</span>
    </div>
  );
}

function EmptyBracketSlot({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
      {label}
    </div>
  );
}

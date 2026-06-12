import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CalendarDays, Medal, Table2, Trophy, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";
import {
  getPublicTournament,
  getPublicTournamentMatches,
  getPublicTournamentStandings,
  getPublicTournamentTeams,
} from "../../services/public-tournaments";
import { MatchStatusBadge, StageBadge } from "../fixtures/fixture-ui";
import { formatDate, formatFormat, StatusBadge } from "../tournaments/tournament-ui";

export function PublicTournamentDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const tournamentQuery = useQuery({
    queryKey: ["public-tournament", slug],
    queryFn: () => getPublicTournament(slug ?? ""),
    enabled: Boolean(slug),
  });

  const teamsQuery = useQuery({
    queryKey: ["public-tournament-teams", slug],
    queryFn: () => getPublicTournamentTeams(slug ?? ""),
    enabled: Boolean(slug),
  });

  const matchesQuery = useQuery({
    queryKey: ["public-tournament-matches", slug],
    queryFn: () => getPublicTournamentMatches(slug ?? ""),
    enabled: Boolean(slug),
  });

  const standingsQuery = useQuery({
    queryKey: ["public-tournament-standings", slug],
    queryFn: () => getPublicTournamentStandings(slug ?? ""),
    enabled: Boolean(slug),
  });

  const isLoading =
    tournamentQuery.isLoading || teamsQuery.isLoading || matchesQuery.isLoading || standingsQuery.isLoading;
  const firstError = tournamentQuery.error ?? teamsQuery.error ?? matchesQuery.error ?? standingsQuery.error;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/tournaments" className="text-lg font-bold tracking-[0.2em] text-emerald-700">
            SPORTSYNC
          </Link>
          <nav className="flex items-center gap-3">
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" to="/tournaments">
              Public Tournaments
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              to={isAuthenticated ? "/dashboard" : "/login"}
            >
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10">
        <Link
          to="/tournaments"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tournaments
        </Link>

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading tournament view...
          </div>
        ) : null}

        {firstError ? (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{getApiErrorMessage(firstError)}</span>
          </div>
        ) : null}

        {tournamentQuery.data ? (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={tournamentQuery.data.status} />
                    <span className="text-sm font-medium text-emerald-700">{tournamentQuery.data.sportType}</span>
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold text-slate-950">{tournamentQuery.data.name}</h1>
                  {tournamentQuery.data.description ? (
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                      {tournamentQuery.data.description}
                    </p>
                  ) : null}
                </div>

                {tournamentQuery.data.winnerTeam ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <Trophy className="h-4 w-4" aria-hidden="true" />
                      Tournament Winner
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-950">
                      {tournamentQuery.data.winnerTeam.name}
                    </p>
                  </div>
                ) : null}
              </div>

              <dl className="mt-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">Format</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{formatFormat(tournamentQuery.data.format)}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Dates
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-950">
                    {formatDate(tournamentQuery.data.startDate)} - {formatDate(tournamentQuery.data.endDate)}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Teams
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-950">{tournamentQuery.data.teamsCount}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <Medal className="h-4 w-4" aria-hidden="true" />
                    Matches
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-950">{tournamentQuery.data.matchesCount}</dd>
                </div>
              </dl>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-950">Teams</h2>
                  <span className="text-sm text-slate-500">{teamsQuery.data?.length ?? 0} active</span>
                </div>
                {teamsQuery.data?.length === 0 ? (
                  <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                    No teams are visible for this tournament yet.
                  </p>
                ) : null}
                {teamsQuery.data && teamsQuery.data.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {teamsQuery.data.map((team) => (
                      <div key={team.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{team.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {team.captain ? `Captain: ${team.captain.name}` : "No captain assigned"}
                            </p>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {team._count?.players ?? 0} players
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-950">Points Table</h2>
                  <Table2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                {standingsQuery.data?.length === 0 ? (
                  <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                    Standings will appear once scores have been recorded.
                  </p>
                ) : null}
                {standingsQuery.data && standingsQuery.data.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-3">Rank</th>
                          <th className="px-3 py-3">Team</th>
                          <th className="px-3 py-3 text-right">P</th>
                          <th className="px-3 py-3 text-right">W</th>
                          <th className="px-3 py-3 text-right">L</th>
                          <th className="px-3 py-3 text-right">D</th>
                          <th className="px-3 py-3 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {standingsQuery.data.map((standing) => (
                          <tr key={standing.team.id}>
                            <td className="px-3 py-3 font-semibold text-slate-950">{standing.rank ?? "-"}</td>
                            <td className="px-3 py-3 font-medium text-slate-800">{standing.team.name}</td>
                            <td className="px-3 py-3 text-right text-slate-700">{standing.played}</td>
                            <td className="px-3 py-3 text-right text-slate-700">{standing.won}</td>
                            <td className="px-3 py-3 text-right text-slate-700">{standing.lost}</td>
                            <td className="px-3 py-3 text-right text-slate-700">{standing.drawn}</td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-950">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Fixtures and Results</h2>
                  <p className="mt-1 text-sm text-slate-500">Scheduled matches and completed scorelines.</p>
                </div>
                <span className="text-sm text-slate-500">{matchesQuery.data?.length ?? 0} matches</span>
              </div>

              {matchesQuery.data?.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                  Fixtures have not been generated for this tournament yet.
                </p>
              ) : null}

              {matchesQuery.data && matchesQuery.data.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Stage</th>
                        <th className="px-4 py-3">Match</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Winner</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matchesQuery.data.map((match) => (
                        <tr key={match.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-semibold text-slate-950">{match.matchNumber}</td>
                          <td className="px-4 py-4">
                            <StageBadge stage={match.stage} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                              <span className={match.winnerTeam?.id === match.teamA.id ? "text-emerald-700" : ""}>
                                {match.teamA.name}
                              </span>
                              <span className="text-slate-400">vs</span>
                              <span className={match.winnerTeam?.id === match.teamB.id ? "text-emerald-700" : ""}>
                                {match.teamB.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {match.teamAScore ?? "-"} - {match.teamBScore ?? "-"}
                          </td>
                          <td className="px-4 py-4 text-slate-700">{match.winnerTeam?.name ?? "-"}</td>
                          <td className="px-4 py-4">
                            <MatchStatusBadge status={match.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

import { useQueries, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";
import { getPublicTournament, getPublicTournaments } from "../../services/public-tournaments";
import type { PublicTournamentDetails } from "../../types/public-tournament";
import { formatDate, formatFormat, StatusBadge } from "../tournaments/tournament-ui";

const PAGE_SIZE = 9;

export function PublicTournamentsPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);

  const tournamentsQuery = useQuery({
    queryKey: ["public-tournaments", { page, search: submittedSearch }],
    queryFn: () =>
      getPublicTournaments({
        page,
        limit: PAGE_SIZE,
        ...(submittedSearch ? { search: submittedSearch } : {}),
      }),
  });

  const pagination = tournamentsQuery.data?.pagination;
  const canGoBack = (pagination?.page ?? page) > 1;
  const canGoForward = pagination ? pagination.page < pagination.totalPages : false;

  const detailQueries = useQueries({
    queries:
      tournamentsQuery.data?.tournaments.map((tournament) => ({
        queryKey: ["public-tournament", tournament.slug],
        queryFn: () => getPublicTournament(tournament.slug),
        enabled: Boolean(tournamentsQuery.data),
      })) ?? [],
  });

  const formatsBySlug = useMemo(() => {
    return new Map(
      detailQueries
        .map((query) => query.data)
        .filter((tournament): tournament is PublicTournamentDetails => Boolean(tournament?.format))
        .map((tournament) => [tournament.slug, tournament.format]),
    );
  }, [detailQueries]);

  const resultLabel = useMemo(() => {
    if (!pagination) {
      return "";
    }

    if (pagination.total === 0) {
      return "No public tournaments found";
    }

    return `${pagination.total} public tournament${pagination.total === 1 ? "" : "s"}`;
  }, [pagination]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/tournaments" className="text-lg font-bold tracking-[0.2em] text-emerald-700">
            SPORTSYNC
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                to="/dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                to="/login"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Public tournaments
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-slate-950">
              Follow fixtures, results, and tables without signing in.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Browse published competitions and open the live tournament view for teams,
              schedules, scorelines, and standings.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Search tournaments</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or sport"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <Button type="submit" className="sm:w-28">
              Search
            </Button>
          </form>
        </div>

        <div className="flex min-h-6 items-center justify-between">
          <p className="text-sm text-slate-600">{resultLabel}</p>
          {submittedSearch ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubmittedSearch("");
                setPage(1);
              }}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear search
            </button>
          ) : null}
        </div>

        {tournamentsQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading public tournaments...
          </div>
        ) : null}

        {tournamentsQuery.isError ? (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{getApiErrorMessage(tournamentsQuery.error)}</span>
          </div>
        ) : null}

        {tournamentsQuery.data?.tournaments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">No tournaments available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Public tournaments appear here once an organizer publishes them.
            </p>
          </div>
        ) : null}

        {tournamentsQuery.data && tournamentsQuery.data.tournaments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournamentsQuery.data.tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.slug}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">{tournament.sportType}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{tournament.name}</h2>
                  </div>
                  <StatusBadge status={tournament.status} />
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Format</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatsBySlug.get(tournament.slug)
                        ? formatFormat(formatsBySlug.get(tournament.slug) ?? "")
                        : "Loading..."}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Dates</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  View tournament
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <Button type="button" variant="secondary" disabled={!canGoBack} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <span className="text-sm font-medium text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button type="button" variant="secondary" disabled={!canGoForward} onClick={() => setPage((value) => value + 1)}>
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

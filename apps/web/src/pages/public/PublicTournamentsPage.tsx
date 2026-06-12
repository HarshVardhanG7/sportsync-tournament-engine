import { useQueries, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
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
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/tournaments" className="inline-flex items-center gap-3 text-lg font-bold tracking-[0.2em] text-emerald-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm shadow-emerald-900/20">
              <Trophy className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>SPORTSYNC</span>
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

      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_48%,#eff6ff_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Public tournaments
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Follow fixtures, results, and tables without signing in.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Browse published competitions and open the live tournament view for teams,
              schedules, scorelines, and standings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                <Trophy className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Published competitions
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                <CalendarDays className="h-4 w-4 text-sky-600" aria-hidden="true" />
                Fixtures and dates
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-white bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
            <p className="mb-3 text-sm font-semibold text-slate-950">Find a tournament</p>
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search tournaments</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or sport"
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <Button type="submit" className="h-11 sm:w-28">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10">
        <div className="flex min-h-6 items-center justify-between">
          <p className="text-sm font-medium text-slate-600">{resultLabel}</p>
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
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="h-1.5 bg-[linear-gradient(90deg,#059669,#0284c7)]" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {tournament.sportType}
                      </p>
                      <h2 className="mt-3 text-xl font-semibold text-slate-950">{tournament.name}</h2>
                    </div>
                    <StatusBadge status={tournament.status} />
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-slate-500">Format</dt>
                      <dd className="mt-1 font-medium text-slate-800">
                        {formatsBySlug.get(tournament.slug)
                          ? formatFormat(formatsBySlug.get(tournament.slug) ?? "")
                          : "Loading..."}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
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

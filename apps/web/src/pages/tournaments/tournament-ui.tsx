import type { TournamentStatus } from "../../types/tournament";

const statusStyles: Record<TournamentStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ONGOING: "bg-sky-50 text-sky-700 ring-sky-200",
  COMPLETED: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function StatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatFormat(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

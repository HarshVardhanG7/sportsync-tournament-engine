import type { MatchStage, MatchStatus } from "../../types/match";

const stageStyles: Record<MatchStage, string> = {
  LEAGUE: "bg-slate-100 text-slate-700 ring-slate-200",
  QUARTER_FINAL: "bg-amber-50 text-amber-700 ring-amber-200",
  SEMI_FINAL: "bg-sky-50 text-sky-700 ring-sky-200",
  FINAL: "bg-violet-50 text-violet-700 ring-violet-200",
};

const statusStyles: Record<MatchStatus, string> = {
  SCHEDULED: "bg-slate-100 text-slate-700 ring-slate-200",
  ONGOING: "bg-sky-50 text-sky-700 ring-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export function StageBadge({ stage }: { stage: MatchStage }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold ring-1 ring-inset ${stageStyles[stage]}`}>
      {formatEnum(stage)}
    </span>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>
      {formatEnum(status)}
    </span>
  );
}

export function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

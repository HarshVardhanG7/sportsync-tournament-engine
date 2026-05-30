import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { getApiErrorMessage } from "../../services/api";
import { createTournament } from "../../services/tournaments";
import { tournamentFormSchema, type TournamentFormValues } from "./tournament-form-schema";

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      sportType: "",
      format: "ROUND_ROBIN",
      startDate: "",
      endDate: "",
      description: "",
    },
  });
  const createMutation = useMutation({
    mutationFn: createTournament,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] });
      navigate("/dashboard/tournaments");
    },
    onError: (caughtError) => {
      setError(getApiErrorMessage(caughtError));
    },
  });

  function onSubmit(values: TournamentFormValues) {
    setError(null);
    createMutation.mutate({
      name: values.name,
      sportType: values.sportType,
      format: values.format,
      startDate: values.startDate,
      endDate: values.endDate,
      ...(values.description ? { description: values.description } : {}),
    });
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link
          to="/dashboard/tournaments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tournaments
        </Link>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">Create tournament</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set up the core details. Teams and fixtures come later.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {error ? (
          <div className="mb-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            label="Tournament name"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            label="Sport type"
            placeholder="Football, Cricket, Basketball"
            error={form.formState.errors.sportType?.message}
            {...form.register("sportType")}
          />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Format
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              {...form.register("format")}
            >
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="KNOCKOUT">Knockout</option>
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Start date"
              type="date"
              error={form.formState.errors.startDate?.message}
              {...form.register("startDate")}
            />
            <TextField
              label="End date"
              type="date"
              error={form.formState.errors.endDate?.message}
              {...form.register("endDate")}
            />
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Optional tournament notes"
              {...form.register("description")}
            />
          </label>
          <div className="flex justify-end gap-3">
            <Link
              to="/dashboard/tournaments"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {createMutation.isPending ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

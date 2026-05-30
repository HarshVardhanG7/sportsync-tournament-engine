import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { getApiErrorMessage } from "../../services/api";
import { getTournament } from "../../services/tournaments";
import { createTeam, deleteTeam, getTournamentTeams, updateTeam } from "../../services/teams";
import type { Team } from "../../types/team";
import { teamFormSchema, type TeamFormValues } from "./team-schemas";

export function TournamentTeamsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tournamentQuery = useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => getTournament(id ?? ""),
    enabled: Boolean(id),
  });
  const teamsQuery = useQuery({
    queryKey: ["teams", "tournament", id],
    queryFn: () => getTournamentTeams(id ?? ""),
    enabled: Boolean(id),
  });
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "" },
  });

  const invalidateTeams = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["teams", "tournament", id] }),
      queryClient.invalidateQueries({ queryKey: ["tournaments", id] }),
      queryClient.invalidateQueries({ queryKey: ["tournaments", "my"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (values: TeamFormValues) => createTeam(id ?? "", values),
    onSuccess: async () => {
      setFeedback("Team created.");
      setError(null);
      form.reset({ name: "" });
      await invalidateTeams();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  const updateMutation = useMutation({
    mutationFn: (values: TeamFormValues) => updateTeam(editingTeam?.id ?? "", values),
    onSuccess: async () => {
      setFeedback("Team updated.");
      setError(null);
      setEditingTeam(null);
      form.reset({ name: "" });
      await invalidateTeams();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: async () => {
      setFeedback("Team deleted.");
      setError(null);
      await invalidateTeams();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  function onSubmit(values: TeamFormValues) {
    setFeedback(null);
    setError(null);

    if (editingTeam) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  }

  function startEditing(team: Team) {
    setFeedback(null);
    setError(null);
    setEditingTeam(team);
    form.reset({ name: team.name });
  }

  function cancelEditing() {
    setEditingTeam(null);
    form.reset({ name: "" });
  }

  function handleDelete(team: Team) {
    if (window.confirm(`Delete ${team.name}? Players will be hidden with the team.`)) {
      deleteMutation.mutate(team.id);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to={`/dashboard/tournaments/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tournament
        </Link>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">
          {tournamentQuery.data?.name ?? "Tournament"} teams
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add teams and open a team workspace to manage its players.
        </p>
      </div>

      {error ? <Message tone="error" message={error} /> : null}
      {feedback ? <Message tone="success" message={feedback} /> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">
          {editingTeam ? "Edit team" : "Add team"}
        </h3>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex-1">
            <TextField
              label="Team name"
              error={form.formState.errors.name?.message}
              {...form.register("name")}
            />
          </div>
          <div className="flex gap-2">
            {editingTeam ? (
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {editingTeam ? "Save Team" : "Add Team"}
            </Button>
          </div>
        </form>
      </section>

      {teamsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading teams...
        </div>
      ) : null}

      {teamsQuery.isError ? <Message tone="error" message={getApiErrorMessage(teamsQuery.error)} /> : null}

      {teamsQuery.data?.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Users className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No teams yet</h3>
          <p className="mt-2 text-sm text-slate-600">Add the first team to start building the tournament field.</p>
        </section>
      ) : null}

      {teamsQuery.data && teamsQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Players</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsQuery.data.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-950">{team.name}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {team.captain ? (
                        <div>
                          <p className="font-medium">{team.captain.name}</p>
                          <p className="text-xs text-slate-500">{team.captain.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{team._count?.players ?? 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/dashboard/teams/${team.id}`}
                          className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Manage Players
                        </Link>
                        <Button type="button" variant="secondary" onClick={() => startEditing(team)}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(team)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
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

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { getApiErrorMessage } from "../../services/api";
import { createPlayer, deletePlayer, getTeamPlayers, updatePlayer } from "../../services/players";
import { getTeam } from "../../services/teams";
import type { Player } from "../../types/player";
import { playerFormSchema, type PlayerFormValues } from "./team-schemas";

export function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const queryClient = useQueryClient();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const teamQuery = useQuery({
    queryKey: ["teams", teamId],
    queryFn: () => getTeam(teamId ?? ""),
    enabled: Boolean(teamId),
  });
  const playersQuery = useQuery({
    queryKey: ["players", "team", teamId],
    queryFn: () => getTeamPlayers(teamId ?? ""),
    enabled: Boolean(teamId),
  });
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: { name: "", jerseyNumber: "", position: "" },
  });

  const invalidatePlayers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["players", "team", teamId] }),
      queryClient.invalidateQueries({ queryKey: ["teams", teamId] }),
      queryClient.invalidateQueries({ queryKey: ["teams", "tournament", teamQuery.data?.tournamentId] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (values: PlayerFormValues) => createPlayer(teamId ?? "", toPlayerPayload(values)),
    onSuccess: async () => {
      setFeedback("Player added.");
      setError(null);
      form.reset({ name: "", jerseyNumber: "", position: "" });
      await invalidatePlayers();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PlayerFormValues) => updatePlayer(editingPlayer?.id ?? "", toPlayerPayload(values)),
    onSuccess: async () => {
      setFeedback("Player updated.");
      setError(null);
      setEditingPlayer(null);
      form.reset({ name: "", jerseyNumber: "", position: "" });
      await invalidatePlayers();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlayer,
    onSuccess: async () => {
      setFeedback("Player deleted.");
      setError(null);
      await invalidatePlayers();
    },
    onError: (caughtError) => setError(getApiErrorMessage(caughtError)),
  });

  function onSubmit(values: PlayerFormValues) {
    setFeedback(null);
    setError(null);

    if (editingPlayer) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  }

  function startEditing(player: Player) {
    setFeedback(null);
    setError(null);
    setEditingPlayer(player);
    form.reset({
      name: player.name,
      jerseyNumber: player.jerseyNumber ? String(player.jerseyNumber) : "",
      position: player.position ?? "",
    });
  }

  function cancelEditing() {
    setEditingPlayer(null);
    form.reset({ name: "", jerseyNumber: "", position: "" });
  }

  function handleDelete(player: Player) {
    if (window.confirm(`Delete ${player.name}?`)) {
      deleteMutation.mutate(player.id);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const backHref = teamQuery.data?.tournamentId
    ? `/dashboard/tournaments/${teamQuery.data.tournamentId}/teams`
    : "/dashboard/tournaments";

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to teams
        </Link>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">
          {teamQuery.data?.name ?? "Team"} players
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Add and maintain the roster for this team.</p>
      </div>

      {error ? <Message tone="error" message={error} /> : null}
      {feedback ? <Message tone="success" message={feedback} /> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">
          {editingPlayer ? "Edit player" : "Add player"}
        </h3>
        <form className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px_1fr_auto]" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            label="Player name"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            label="Jersey number"
            type="number"
            min={1}
            error={form.formState.errors.jerseyNumber?.message}
            {...form.register("jerseyNumber")}
          />
          <TextField
            label="Position"
            error={form.formState.errors.position?.message}
            {...form.register("position")}
          />
          <div className="flex items-end gap-2">
            {editingPlayer ? (
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {editingPlayer ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </section>

      {teamQuery.isLoading || playersQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading players...
        </div>
      ) : null}

      {teamQuery.isError ? <Message tone="error" message={getApiErrorMessage(teamQuery.error)} /> : null}
      {playersQuery.isError ? <Message tone="error" message={getApiErrorMessage(playersQuery.error)} /> : null}

      {playersQuery.data?.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <UserRound className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No players yet</h3>
          <p className="mt-2 text-sm text-slate-600">Add the first player to build this roster.</p>
        </section>
      ) : null}

      {playersQuery.data && playersQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Jersey</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {playersQuery.data.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-950">{player.name}</td>
                    <td className="px-4 py-4 text-slate-700">{player.jerseyNumber ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-700">{player.position || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => startEditing(player)}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(player)}
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

function toPlayerPayload(values: PlayerFormValues) {
  return {
    name: values.name,
    ...(values.jerseyNumber ? { jerseyNumber: Number(values.jerseyNumber) } : {}),
    ...(values.position ? { position: values.position } : {}),
  };
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

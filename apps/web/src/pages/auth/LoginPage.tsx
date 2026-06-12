import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LogIn, Trophy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  async function onSubmit(values: LoginForm) {
    setError(null);

    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError));
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Welcome back
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Log in to SportSync</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use your organizer or team captain account to continue.
        </p>
      </div>

      {error ? (
        <div className="mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-2 w-full">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {form.formState.isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <Link
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        to="/tournaments"
      >
        <Trophy className="h-4 w-4" aria-hidden="true" />
        View tournaments
      </Link>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to SportSync?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ORGANIZER", "TEAM_CAPTAIN"]).default("ORGANIZER"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "ORGANIZER",
    },
  });

  async function onSubmit(values: RegisterForm) {
    setError(null);

    try {
      await register(values);
      navigate("/dashboard", { replace: true });
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError));
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Get started
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Create your account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set up access for tournament organizers or team captains.
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
          label="Name"
          autoComplete="name"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
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
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Role
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            {...form.register("role")}
          >
            <option value="ORGANIZER">Organizer</option>
            <option value="TEAM_CAPTAIN">Team Captain</option>
          </select>
        </label>
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-2 w-full">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}

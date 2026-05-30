import { LogOut, Menu, UserRound } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

export function TopNavigation() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 md:hidden"
          type="button"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-950">Dashboard</h1>
          <p className="text-xs text-slate-500">Manage tournament operations</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-right sm:flex">
          <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-slate-950">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void logout()} type="button">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

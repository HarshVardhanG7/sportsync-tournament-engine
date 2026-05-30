import { Outlet } from "react-router-dom";
import { SidebarNavigation } from "../components/navigation/SidebarNavigation";
import { TopNavigation } from "../components/navigation/TopNavigation";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <SidebarNavigation />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavigation />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

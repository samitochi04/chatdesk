import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import WelcomeOnboarding from "@/pages/dashboard/WelcomeOnboarding";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { organization, profile } = useAuth();

  // Show onboarding if user has no organization (and is not super_admin)
  const needsOnboarding = !organization && profile?.role !== "super_admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {!needsOnboarding && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
          {needsOnboarding ? <WelcomeOnboarding /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

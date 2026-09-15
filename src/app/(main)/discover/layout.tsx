import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

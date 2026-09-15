import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function BiodataLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

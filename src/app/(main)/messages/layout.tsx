import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

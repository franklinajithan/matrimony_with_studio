import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

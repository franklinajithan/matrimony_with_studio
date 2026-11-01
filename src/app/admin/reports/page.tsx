import { requireAdminPage } from "@/app/admin/guard";
import ReportsClient from "./page-client";
export default async function ReportsPage() {
  await requireAdminPage();
  return <ReportsClient />;
}

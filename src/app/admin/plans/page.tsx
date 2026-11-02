import { requireAdminPage } from "@/app/admin/guard";
import AdminPlansClient from "./page-client";
export const dynamic = "force-dynamic";
export default async function AdminPlansPage() { await requireAdminPage(); return <AdminPlansClient />; }

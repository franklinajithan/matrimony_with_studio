import { requireAdminPage } from "@/app/admin/guard";
import PageClient from "./page-client";
export default async function Page() {
  await requireAdminPage("manage");
  return <PageClient />;
}

import { requireAdminPage } from "@/app/admin/guard";
import { SupportInbox } from "@/components/support/SupportInbox";
export default async function Page() {
  await requireAdminPage("support");
  return <SupportInbox staff />;
}

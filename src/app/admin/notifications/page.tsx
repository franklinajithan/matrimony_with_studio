import { requireAdminPage } from "@/app/admin/guard";
import PageClient from "./page-client";
import { EmailDelivery } from "@/components/admin/EmailDelivery";
export default async function Page() {
  await requireAdminPage("notifications");
  return (
    <>
      <PageClient />
      <EmailDelivery />
    </>
  );
}

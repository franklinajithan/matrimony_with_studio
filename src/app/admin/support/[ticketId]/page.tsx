import { requireAdminPage } from "@/app/admin/guard";
import { SupportThread } from "@/components/support/SupportThread";
export default async function Page({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  await requireAdminPage("support");
  const { ticketId } = await params;
  return <SupportThread staff ticketId={ticketId} />;
}

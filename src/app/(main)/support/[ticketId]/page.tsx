import { SupportThread } from "@/components/support/SupportThread";
export default async function Page({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <SupportThread ticketId={ticketId} />;
}

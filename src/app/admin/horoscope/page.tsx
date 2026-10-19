import { requireAdminPage } from "@/app/admin/guard";
import Controls from "./controls";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireAdminPage();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Horoscope controls</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Private content is not available to moderators here. Keep the rollout
        paused until security, OCR, privacy and device checks are complete.
      </p>
      <Controls />
    </div>
  );
}

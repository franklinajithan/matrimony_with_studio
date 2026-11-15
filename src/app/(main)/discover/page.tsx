import { getServerAdminAccess } from "@/lib/auth/admin";
import { AdminProfileDirectory } from "./admin-profile-directory";
import { Suspense } from "react";
import { PreferenceDiscovery } from "@/components/discovery/PreferenceDiscovery";
import { PageFrame } from "@/components/dashboard/PageHero";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DiscoverPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const access = await getServerAdminAccess();
  if (access.status === "authorized") {
    const { page } = await searchParams;
    return <AdminProfileDirectory page={page} />;
  }

  return (
    <Suspense
      fallback={
        <PageFrame>
          <Skeleton className="h-40 rounded-[30px]" />
          <Skeleton className="h-24" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Skeleton key={n} className="aspect-[3/5] rounded-2xl" />
            ))}
          </div>
        </PageFrame>
      }
    >
      <PreferenceDiscovery />
    </Suspense>
  );
}

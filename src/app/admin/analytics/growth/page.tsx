import { GrowthReportSections } from "./report-sections";

export default async function GrowthPage({ searchParams }: {
  searchParams: Promise<{ days?: string; review?: string }>;
}) {
  return <GrowthReportSections query={await searchParams} />;
}

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Place = { id: number; name: string; country_code: string; country?: string; admin1?: string; admin2?: string };
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim();
  const country = (request.nextUrl.searchParams.get("country") || "").trim().toUpperCase();
  if (query.length < 3 || query.length > 100 || (country && !/^[A-Z]{2}$/.test(country))) {
    return NextResponse.json({ results: [] });
  }
  const params = new URLSearchParams({ name: query, count: "20", language: "en", format: "json" });
  if (country) params.set("countryCode", country);
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("Location provider unavailable");
    const data: { results?: Place[] } = await response.json();
    return NextResponse.json({
      results: (data.results || []).filter((p) => typeof p.id === "number" && typeof p.name === "string").map((p) => ({
        id: p.id,
        name: p.name,
        countryCode: p.country_code,
        country: p.country || "",
        region: p.admin1 || "",
        district: p.admin2 || "",
      })),
    });
  } catch {
    return NextResponse.json({ results: [], unavailable: true }, { status: 503 });
  }
}

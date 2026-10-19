import type { z } from "zod";
import type { planetSchema } from "@/lib/horoscope/schema";
export default function HoroscopeChart({
  planets,
  chart,
}: {
  planets: z.infer<typeof planetSchema>[];
  chart: "D1" | "D9";
}) {
  const positions = [12, 1, 2, 3, 11, 0, 0, 4, 10, 0, 0, 5, 9, 8, 7, 6];
  const data = planets.filter((p) => p.chart === chart);
  if (!data.length)
    return (
      <p className="text-sm text-muted-foreground">
        {chart}: No member-confirmed planetary positions recorded. No chart has
        been calculated.
      </p>
    );
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">
        {chart} · South Indian sign layout · Member-entered
      </figcaption>
      <div className="grid aspect-square max-w-sm grid-cols-4 overflow-hidden rounded-xl border border-amber-400 bg-amber-50/40">
        {positions.map((sign, i) => (
          <div
            key={i}
            className={
              sign
                ? "min-w-0 border border-amber-200 p-1 text-[10px] sm:p-2 sm:text-xs"
                : "bg-background/70"
            }
          >
            {sign > 0 && (
              <>
                <span className="text-muted-foreground">Sign {sign}</span>
                <div className="break-words font-semibold text-purple-900">
                  {data
                    .filter((p) => p.sign === sign)
                    .map(
                      (p) =>
                        `${p.planet}${p.degrees !== undefined ? " " + p.degrees + "°" : ""}`,
                    )
                    .join(" · ") || "—"}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Signs 1–12 = Aries–Pisces. Positions were confirmed by the member, not
        independently calculated.
      </p>
    </figure>
  );
}

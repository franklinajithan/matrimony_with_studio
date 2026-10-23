"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { countryCodeForName } from "@/lib/onboarding/schema";

type City = { id: number; name: string; country: string; region: string; district: string };
export function GlobalCityInput({ value, country, onChange }: {
  value: string;
  country: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<City[]>([]);
  const [active, setActive] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!active || value.trim().length < 3) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value.trim() });
        const code = countryCodeForName(country);
        if (code) params.set("country", code);
        const res = await fetch(`/api/locations/search?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Lookup unavailable");
        const data = await res.json();
        setItems(Array.isArray(data.results) ? data.results : []);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setUnavailable(true);
        }
      }
    }, 350);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [value, country, active]);
  return (
    <div className="relative">
      <Input
        id="region"
        autoComplete="off"
        value={value}
        onChange={(event) => { onChange(event.target.value); setActive(true); }}
        onFocus={() => setActive(true)}
        onBlur={() => setTimeout(() => setActive(false), 150)}
        className="min-h-11"
        placeholder="Search or enter any city, town or village"
        aria-label="City, town or village"
      />
      {active && items.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-background p-1 shadow-lg" role="listbox" aria-label="Matching places">
          {items.map((place) => (
            <li key={place.id}>
              <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onChange(place.name); setItems([]); setActive(false); }}>
                <span className="font-medium">{place.name}</span>
                <span className="block text-xs text-muted-foreground">{[place.district, place.region, place.country].filter(Boolean).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {unavailable ? "Location suggestions unavailable; you can still enter your town manually." : "Choose a suggested place, or type your own if it is not listed."}
      </p>
    </div>
  );
}

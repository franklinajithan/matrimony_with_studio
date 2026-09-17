"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { COUNTRY_OPTIONS } from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function CountryMultiSelectInput({ id, value, disabled, className, placeholder, onChange }: Props) {
  const selected = React.useMemo(
    () => value.split(",").map((item) => item.trim()).filter(Boolean),
    [value]
  );
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = COUNTRY_OPTIONS.filter(
    (country) => !selected.includes(country) && country.toLowerCase().includes(query.trim().toLowerCase())
  ).slice(0, 8);

  function emit(next: string[]) {
    onChange?.({
      target: { value: next.join(", ") },
      currentTarget: { value: next.join(", ") },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  function add(country: string) {
    if (!selected.includes(country)) emit([...selected, country]);
    setQuery("");
    setOpen(true);
  }

  function remove(country: string) {
    emit(selected.filter((item) => item !== country));
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input id={id} type="hidden" value={value} readOnly />
      <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2.5 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {selected.map((country) => (
          <span key={country} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
            {country}
            <button type="button" disabled={disabled} onClick={() => remove(country)} className="rounded-full p-0.5 hover:bg-primary/10" aria-label={`Remove ${country}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0]) { event.preventDefault(); add(matches[0]); }
              if (event.key === "Backspace" && !query && selected.length) remove(selected[selected.length - 1]);
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder={selected.length ? "Add another country…" : (placeholder || "Search countries…")}
            className="min-h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
        </div>
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg">
          {matches.length ? matches.map((country) => (
            <button key={country} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => add(country)} className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
              <span>{country}</span><Check className="h-4 w-4 opacity-0" />
            </button>
          )) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matching country</p>
          )}
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">Start typing, then choose a country. You can select more than one.</p>
    </div>
  );
}

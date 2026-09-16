"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type DateParts = { year: string; month: string; day: string };

function parseDob(value?: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) };
}

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

export interface DateOfBirthPickerProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  minimumAge?: number;
  oldestYear?: number;
}

export function DateOfBirthPicker({
  value,
  onChange,
  disabled = false,
  id = "dob",
  className,
  minimumAge = 18,
  oldestYear = 1920,
}: DateOfBirthPickerProps) {
  const [selected, setSelected] = useState<DateParts>(() => parseDob(value));
  const today = new Date();
  const latestYear = today.getFullYear() - minimumAge;
  const years = useMemo(
    () => Array.from({ length: Math.max(1, latestYear - oldestYear + 1) }, (_, index) => latestYear - index),
    [latestYear, oldestYear]
  );
  const maxDays = daysInMonth(selected.year, selected.month);

  useEffect(() => {
    setSelected(parseDob(value));
  }, [value]);

  function update(part: keyof DateParts, nextValue: string) {
    const next = { ...selected, [part]: nextValue };
    if (part === "month" || part === "year") {
      const allowedDays = daysInMonth(next.year, next.month);
      if (next.day && Number(next.day) > allowedDays) next.day = String(allowedDays);
    }
    setSelected(next);
    if (next.year && next.month && next.day) {
      onChange(`${next.year}-${next.month.padStart(2, "0")}-${next.day.padStart(2, "0")}`);
    } else if (value) {
      onChange("");
    }
  }

  const selectClass = "h-10 min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

  return (
    <div className={cn("w-full", className)} id={id}>
      <div className="grid grid-cols-[0.8fr_1.35fr_1fr] gap-2 sm:gap-3">
        <select aria-label="Birth day" className={selectClass} value={selected.day} onChange={(event) => update("day", event.target.value)} disabled={disabled}>
          <option value="">Day</option>
          {Array.from({ length: maxDays }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
        <select aria-label="Birth month" className={selectClass} value={selected.month} onChange={(event) => update("month", event.target.value)} disabled={disabled}>
          <option value="">Month</option>
          {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
        </select>
        <select aria-label="Birth year" className={selectClass} value={selected.year} onChange={(event) => update("year", event.target.value)} disabled={disabled}>
          <option value="">Year</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
    </div>
  );
}

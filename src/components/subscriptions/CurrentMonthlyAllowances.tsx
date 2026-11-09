"use client";

import { useEffect, useState } from "react";
import { monthlyAllowanceLabels } from "@/lib/subscriptions/catalogue-data";
import { supabase } from "@/lib/supabase/client";

export function CurrentMonthlyAllowances() {
  const [labels, setLabels] = useState<string[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      const { data, error } = await supabase.rpc("my_membership_allowances").abortSignal(controller.signal);
      if (controller.signal.aborted) return;
      const limits = Object.entries(data?.allowances ?? {}).map(([key, allowance]) => [
        key, (allowance as { limit?: number | null }).limit,
      ]);
      setLabels(error ? [] : monthlyAllowanceLabels(Object.fromEntries(limits)));
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (labels === null) return <p role="status" className="text-sm text-muted-foreground">Loading monthly allowances…</p>;
  if (!labels.length) return <p role="status" className="text-sm text-muted-foreground">Monthly allowances are temporarily unavailable.</p>;
  return <ul aria-label="Current monthly allowances" className="space-y-1 text-sm">
    {labels.map(label => <li key={label}>{label}</li>)}
  </ul>;
}

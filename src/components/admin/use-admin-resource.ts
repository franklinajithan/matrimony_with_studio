"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAdminResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Unable to load records");
      if (current === sequence.current) setData(payload);
    } catch (error) {
      if (current === sequence.current) {
        setData(null);
        setError(
          error instanceof Error ? error.message : "Unable to load records",
        );
      }
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void refresh();
    return () => {
      sequence.current++;
    };
  }, [refresh]);
  return { data, error, loading, refresh };
}
export async function adminMutation(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Unable to save changes");
  return payload;
}

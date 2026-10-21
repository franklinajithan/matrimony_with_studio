"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Settings = {
  horoscope_enabled: boolean;
  horoscope_upload_enabled: boolean;
  ai_horoscope_matching_enabled: boolean;
  matching_rule_sets: string[];
  retention_days: number;
  daily_ai_limit: number;
};
export default function Controls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [provider, setProvider] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState("");
  const [restricted, setRestricted] = useState(true);
  async function load() {
    try {
      const r = await fetch("/api/admin/horoscope", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const { singleton, ...s } = d.settings;
      void singleton;
      setSettings(s);
      setMetrics(d.metrics);
      setProvider(d.providerConfigured);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(body: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/horoscope", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Saved.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 space-y-5">
      {message && (
        <p role="status" className="rounded-xl border p-4">
          {message}
        </p>
      )}
      {settings && (
        <form
          className="space-y-5 rounded-2xl border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save(settings);
          }}
        >
          <p className="text-sm">
            Dedicated provider:{" "}
            {provider
              ? "Configured (privacy terms and accuracy still require review)"
              : "Not configured"}
          </p>
          {(
            [
              "horoscope_enabled",
              "horoscope_upload_enabled",
              "ai_horoscope_matching_enabled",
            ] as const
          ).map((key) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.checked })
                }
              />
              {key.replaceAll("_", " ")}
            </label>
          ))}
          <label className="block">
            Source access retention (days)
            <input
              className="ml-3 w-20 rounded border p-2"
              type="number"
              min={1}
              max={90}
              value={settings.retention_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retention_days: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="block">
            Daily per-member AI requests
            <input
              className="ml-3 w-20 rounded border p-2"
              type="number"
              min={1}
              max={20}
              value={settings.daily_ai_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  daily_ai_limit: Number(e.target.value),
                })
              }
            />
          </label>
          <p className="text-sm text-muted-foreground">
            Traditional rule sets: none independently validated. Scoring cannot
            be enabled. Retention denies access after expiry; physical storage
            cleanup requires the documented scheduled worker.
          </p>
          <Button disabled={busy}>Save controls</Button>
        </form>
      )}
      <form
        className="space-y-3 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save({ member, restricted });
        }}
      >
        <h2 className="font-semibold">Per-member restriction</h2>
        <label className="block text-sm">
          Member UUID
          <input
            className="mt-2 w-full rounded border p-3"
            value={member}
            onChange={(e) => setMember(e.target.value)}
            required
          />
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={restricted}
            onChange={(e) => setRestricted(e.target.checked)}
          />
          Restrict horoscope feature
        </label>
        <Button disabled={busy}>Apply restriction</Button>
      </form>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Aggregate activity</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm text-muted-foreground">
                {key.replaceAll("_", " ")}
              </dt>
              <dd className="text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Counts only. OCR accuracy, correction rates and vendor costs require a
          reviewed benchmark and provider usage integration.
        </p>
      </section>
    </div>
  );
}

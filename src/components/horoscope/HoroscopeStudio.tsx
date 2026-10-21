"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Upload,
  Eye,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fieldDefinitions,
  type FieldKey,
  type HoroscopeFields,
  type HoroscopeRecord,
  type Candidate,
  type HoroscopeSave,
} from "@/lib/horoscope/schema";
import HoroscopeChart from "./HoroscopeChart";
const input =
  "mt-2 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const card =
  "rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6";
type Settings = {
  horoscope_enabled: boolean;
  horoscope_upload_enabled: boolean;
  ai_horoscope_matching_enabled: boolean;
};
type DocumentRow = {
  id: string;
  mime_type: string;
  processing_state: string;
  expires_at: string;
};
async function api(path: string, options?: RequestInit) {
  const response = await fetch("/api/horoscope" + path, {
    ...options,
    cache: "no-store",
    headers:
      options?.body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Request failed. Please retry.");
  return data;
}
const defaults: HoroscopeFields = {
  timeQuality: "unknown",
  language: "",
  timezone: "",
};
export default function HoroscopeStudio({ member }: { member?: string }) {
  const [record, setRecord] = useState<HoroscopeRecord | null>(null);
  const [fields, setFields] = useState<HoroscopeFields>(defaults);
  const [tradition, setTradition] =
    useState<HoroscopeSave["tradition"]>("tamil");
  const [visibility, setVisibility] =
    useState<HoroscopeSave["visibility"]>("private");
  const [shared, setShared] = useState<FieldKey[]>([]);
  const [compareConsent, setCompareConsent] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [planets, setPlanets] = useState<HoroscopeSave["planets"]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [preview, setPreview] = useState(Boolean(member));
  const [reviewed, setReviewed] = useState(false);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [processingConsent, setProcessingConsent] = useState(false);
  const [extraction, setExtraction] = useState<{
    id: string;
    payload: { fields: Candidate[]; warnings: string[] };
  } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceMime, setSourceMime] = useState("");
  const [comparison, setComparison] = useState<Record<string, unknown> | null>(
    null,
  );
  const applyRecord = useCallback((p: HoroscopeRecord | null) => {
    setRecord(p);
    setFields(p?.fields || defaults);
    setTradition((p?.tradition || "tamil") as HoroscopeSave["tradition"]);
    setVisibility((p?.visibility || "private") as HoroscopeSave["visibility"]);
    setShared(p?.shared_fields || []);
    setCompareConsent(p?.comparison_consent || false);
    setAiConsent(p?.ai_consent || false);
    setPlanets((p?.provenance?.planets as HoroscopeSave["planets"]) || []);
    setReviewed(false);
  }, []);
  const loadGeneration = useRef(0);
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setError("");
    applyRecord(null);
    setComparison(null);
    setSettings(null);
    setPreview(Boolean(member));
    try {
      const d = await api(
        member ? "?member=" + encodeURIComponent(member) : "",
      );
      if (generation !== loadGeneration.current) return;
      applyRecord(d.profile);
      setSettings(d.settings);
      if (!member) {
        const docs = await api("/documents");
        if (generation !== loadGeneration.current) return;
        setDocuments(docs.documents);
      }
    } catch (e) {
      if (generation === loadGeneration.current) setError((e as Error).message);
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [member, applyRecord]);
  useEffect(() => {
    void load();
    return () => {
      loadGeneration.current++;
    };
  }, [load]);
  useEffect(() => {
    if (!member) return;
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [member, load]);
  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function change(key: FieldKey, value: string) {
    setFields((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "timeQuality" && value === "unknown"
        ? { timeOfBirth: "", lagna: "" }
        : {}),
    }));
    setReviewed(false);
  }
  async function save() {
    if (!reviewed)
      throw new Error(
        "Review the values and confirm they are correct before saving.",
      );
    const data = await api("", {
      method: "PUT",
      body: JSON.stringify({
        revision: record?.revision || 0,
        tradition,
        visibility,
        fields,
        shared_fields: shared,
        comparison_consent: compareConsent,
        ai_consent: aiConsent,
        planets,
        ...(extraction ? { extraction_id: extraction.id } : {}),
      }),
    });
    applyRecord(data.profile);
    setExtraction(null);
    setMessage(
      visibility === "private"
        ? "Saved privately."
        : "Saved with your selected visibility and fields.",
    );
  }
  async function removeAll() {
    if (
      !window.confirm(
        "Delete your horoscope, extracted data and source documents? This cannot be undone.",
      )
    )
      return;
    await api("", { method: "DELETE" });
    applyRecord(null);
    setDocuments([]);
    setExtraction(null);
    setComparison(null);
    setSourceUrl("");
    setMessage("Horoscope and source documents deleted.");
  }
  async function upload() {
    if (!file) throw new Error("Choose a file first.");
    const form = new FormData();
    form.append("file", file);
    const d = await api("/documents", { method: "POST", body: form });
    setDocuments((prev) => [
      d.document,
      ...prev.filter((x) => x.id !== d.document.id),
    ]);
    setFile(null);
    setMessage(
      "Uploaded privately. Choose Extract & review to process with your consent.",
    );
  }
  async function extract(id: string) {
    if (!processingConsent)
      throw new Error("Confirm processing consent first.");
    setExtraction(null);
    const d = await api("/documents", {
      method: "PATCH",
      body: JSON.stringify({ id, processingConsent }),
    });
    setExtraction(d.extraction);
    const source = await api("/documents?id=" + id);
    setSourceUrl(source.url);
    setSourceMime(documents.find((x) => x.id === id)?.mime_type || "");
    setMessage(
      "Needs review. Select legible candidate values, correct the form, then Confirm & Save.",
    );
    setPreview(false);
  }
  async function compare(ai = false) {
    setComparison(null);
    const d = await api("/compare", {
      method: "POST",
      body: JSON.stringify({ member, ai }),
    });
    setComparison(d);
  }
  function download(data: unknown, name: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (loading)
    return (
      <div className="p-8" role="status">
        Loading private horoscope…
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 pb-28 pt-5 sm:px-6 sm:pt-8">
      <header className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-accent via-background to-amber-50 p-5 sm:p-9">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-4 w-4" />
          CupidMatch · ஜாதகம்
        </p>
        <h1 className="mt-3 font-headline text-3xl text-primary-dark sm:text-5xl">
          {member ? "Member horoscope" : "My Horoscope"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Your traditions, your details, your choice. A cultural compatibility
          aid, not a scientific prediction or a guarantee of relationship
          success.
        </p>
        <p className="mt-3 flex items-start gap-2 text-sm text-primary-dark">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {member
            ? "Only fields this member permits are shown."
            : "New and imported horoscopes stay private until you choose otherwise."}
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900"
        >
          {error}{" "}
          <button className="ml-2 underline" onClick={() => void load()}>
            Reload
          </button>
        </div>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-accent p-4 text-primary-dark"
        >
          {message}
        </p>
      )}
      {busy && (
        <p role="status" aria-live="polite" className="text-primary">
          {busy}… Please keep this page open.
        </p>
      )}
      {settings && !settings.horoscope_enabled && (
        <div className={card}>
          <h2 className="font-semibold">Horoscope rollout is paused</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New editing, uploading and comparisons are unavailable while
            validation is completed. You can still export or delete your
            existing records.
          </p>
        </div>
      )}
      {!settings && !record ? (
        <p>Unable to load the horoscope. Please sign in or retry.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {!member && (
              <>
                <Button variant="outline" onClick={() => setPreview(!preview)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {preview ? "Edit details" : "Preview"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!record || !!busy}
                  onClick={() =>
                    void run("Exporting", async () => {
                      const fresh = await api("?export=1");
                      if (!fresh.profile)
                        throw new Error("No horoscope to export.");
                      download(fresh, "my-horoscope.json");
                    })
                  }
                >
                  Export my data
                </Button>
                <Button
                  variant="outline"
                  disabled={!!busy}
                  onClick={() => void run("Deleting", removeAll)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete horoscope
                </Button>
              </>
            )}
            {member && (
              <Link
                href="/dashboard/horoscope"
                className="rounded-xl border px-4 py-2 text-sm"
              >
                My horoscope
              </Link>
            )}
          </div>
          {member && !record ? (
            <div className={card}>
              This horoscope is unavailable or has not been created.
            </div>
          ) : preview ? (
            <section className={card}>
              <h2 className="font-headline text-2xl">
                {record ? "Horoscope preview" : "Draft preview"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tradition: {tradition} ·{" "}
                {member
                  ? "Permitted information only"
                  : visibility === "private"
                    ? "Hidden / Private"
                    : visibility}{" "}
                ·{" "}
                {member
                  ? "Member-confirmed shared values"
                  : "Form preview — save to confirm changes"}
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {fieldDefinitions
                  .filter(([key]) => fields[key])
                  .map(([key, label]) => (
                    <div
                      key={key}
                      className="min-w-0 rounded-xl bg-accent/50 p-3"
                    >
                      <dt className="text-xs font-semibold text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words">
                        {fields[key]}
                      </dd>
                    </div>
                  ))}
              </dl>
              {!Object.values(fields).some(Boolean) && (
                <p>No shared details available.</p>
              )}
              {!member && (
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <HoroscopeChart planets={planets} chart="D1" />
                  <HoroscopeChart planets={planets} chart="D9" />
                </div>
              )}
            </section>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void run("Saving", save);
              }}
            >
              <fieldset
                disabled={!!busy || !settings?.horoscope_enabled}
                className={card}
              >
                <legend className="px-2 font-headline text-2xl">
                  Birth details & chart
                </legend>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={!advanced ? "default" : "outline"}
                    onClick={() => setAdvanced(false)}
                  >
                    Basic
                  </Button>
                  <Button
                    type="button"
                    variant={advanced ? "default" : "outline"}
                    onClick={() => setAdvanced(true)}
                  >
                    Advanced (optional)
                  </Button>
                </div>
                <label className="mt-5 block text-sm font-semibold">
                  Horoscope tradition
                  <select
                    className={input}
                    value={tradition}
                    onChange={(e) => {
                      setTradition(
                        e.target.value as HoroscopeSave["tradition"],
                      );
                      setReviewed(false);
                    }}
                  >
                    <option value="tamil">Tamil / South Indian</option>
                    <option value="vedic">Vedic / North Indian</option>
                    <option value="western">Western</option>
                    <option value="other">Other / Unspecified</option>
                  </select>
                </label>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {fieldDefinitions
                    .filter(
                      ([, , group]) =>
                        group === (advanced ? "advanced" : "basic"),
                    )
                    .map(([key, label]) => (
                      <label
                        key={key}
                        className={
                          "min-w-0 text-sm font-semibold " +
                          (key === "notes" ? "sm:col-span-2" : "")
                        }
                      >
                        {label}
                        {key === "timeQuality" ? (
                          <select
                            className={input}
                            value={fields.timeQuality || "unknown"}
                            onChange={(e) => change(key, e.target.value)}
                          >
                            <option value="unknown">Unknown / தெரியாது</option>
                            <option value="approximate">Approximate</option>
                            <option value="exact">Exact (as recorded)</option>
                          </select>
                        ) : key === "notes" ? (
                          <textarea
                            className={input}
                            value={fields[key] || ""}
                            maxLength={2000}
                            onChange={(e) => change(key, e.target.value)}
                          />
                        ) : (
                          <input
                            className={input}
                            type={
                              key === "dateOfBirth"
                                ? "date"
                                : key === "timeOfBirth"
                                  ? "time"
                                  : "text"
                            }
                            disabled={
                              key === "timeOfBirth" &&
                              fields.timeQuality === "unknown"
                            }
                            placeholder={
                              key === "timezone" ? "Europe/London" : undefined
                            }
                            maxLength={200}
                            value={fields[key] || ""}
                            onChange={(e) => change(key, e.target.value)}
                          />
                        )}
                      </label>
                    ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Enter chart facts only where known. Unknown birth time
                  excludes lagna and house comparisons. Nothing is calculated
                  from birth facts by AI.
                </p>
                {advanced && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">
                      Member-confirmed D1 / D9 planetary positions
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Copy from your existing chart. Sign 1 = Aries through 12 =
                      Pisces. North Indian layout and automatic chart
                      calculation are not installed.
                    </p>
                    {planets.map((p, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-5"
                      >
                        <label className="text-xs">
                          Chart
                          <select
                            className={input}
                            value={p.chart}
                            onChange={(e) => {
                              setPlanets((ps) =>
                                ps.map((x, i) =>
                                  i === index
                                    ? {
                                        ...x,
                                        chart: e.target.value as "D1" | "D9",
                                      }
                                    : x,
                                ),
                              );
                              setReviewed(false);
                            }}
                          >
                            <option>D1</option>
                            <option>D9</option>
                          </select>
                        </label>
                        <label className="text-xs">
                          Planet
                          <select
                            className={input}
                            value={p.planet}
                            onChange={(e) => {
                              setPlanets((ps) =>
                                ps.map((x, i) =>
                                  i === index
                                    ? {
                                        ...x,
                                        planet: e.target
                                          .value as typeof p.planet,
                                      }
                                    : x,
                                ),
                              );
                              setReviewed(false);
                            }}
                          >
                            {[
                              "Sun",
                              "Moon",
                              "Mars",
                              "Mercury",
                              "Jupiter",
                              "Venus",
                              "Saturn",
                              "Rahu",
                              "Ketu",
                            ].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs">
                          Sign (1–12)
                          <input
                            className={input}
                            type="number"
                            min={1}
                            max={12}
                            value={p.sign}
                            onChange={(e) => {
                              setPlanets((ps) =>
                                ps.map((x, i) =>
                                  i === index
                                    ? { ...x, sign: Number(e.target.value) }
                                    : x,
                                ),
                              );
                              setReviewed(false);
                            }}
                          />
                        </label>
                        <label className="text-xs">
                          Degrees (optional)
                          <input
                            className={input}
                            type="number"
                            min={0}
                            max={29.999}
                            step="any"
                            value={p.degrees ?? ""}
                            onChange={(e) => {
                              setPlanets((ps) =>
                                ps.map((x, i) =>
                                  i === index
                                    ? {
                                        ...x,
                                        degrees: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      }
                                    : x,
                                ),
                              );
                              setReviewed(false);
                            }}
                          />
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPlanets((ps) =>
                              ps.filter((_, i) => i !== index),
                            );
                            setReviewed(false);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={planets.length >= 18}
                      onClick={() => {
                        setPlanets((ps) => [
                          ...ps,
                          { planet: "Sun", chart: "D1", sign: 1 },
                        ]);
                        setReviewed(false);
                      }}
                    >
                      Add planetary position
                    </Button>
                  </div>
                )}
              </fieldset>
              <fieldset
                disabled={!!busy || !settings?.horoscope_enabled}
                className={card}
              >
                <legend className="px-2 font-headline text-2xl">
                  Privacy & consent
                </legend>
                <label className="block text-sm font-semibold">
                  Who can view?
                  <select
                    className={input}
                    value={visibility}
                    onChange={(e) => {
                      setVisibility(
                        e.target.value as HoroscopeSave["visibility"],
                      );
                      setReviewed(false);
                    }}
                  >
                    <option value="private">Private — only me</option>
                    <option value="connections">Approved connections</option>
                    <option value="members">
                      Logged-in eligible published members
                    </option>
                  </select>
                </label>
                <p className="my-4 text-sm text-muted-foreground">
                  Choose each field to share. Birth date, time, location and all
                  other fields are hidden unless selected. Source documents and
                  provenance are always private.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fieldDefinitions.map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-primary"
                        checked={shared.includes(key)}
                        onChange={(e) => {
                          setShared((prev) =>
                            e.target.checked
                              ? [...prev, key]
                              : prev.filter((x) => x !== key),
                          );
                          setReviewed(false);
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label className="mt-6 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    checked={compareConsent}
                    onChange={(e) => {
                      setCompareConsent(e.target.checked);
                      setReviewed(false);
                    }}
                  />
                  Allow comparisons using only my selected shared fields, when
                  both members permit access.
                </label>
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    checked={aiConsent}
                    onChange={(e) => {
                      setAiConsent(e.target.checked);
                      setReviewed(false);
                    }}
                  />
                  Allow Google Gemini to process my selected shared chart fields
                  for requested AI explanations. This is optional; withdraw by
                  unticking and saving.
                </label>
                <p className="mt-3 text-xs text-muted-foreground">
                  Birth facts are personal information. Do not upload another
                  person’s chart without authority.{" "}
                  <Link
                    className="underline"
                    href="/dashboard/horoscope/privacy"
                  >
                    Read our privacy notice
                  </Link>
                  . Copies already downloaded by a recipient cannot be recalled.
                </p>
              </fieldset>
              <div className={card}>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    checked={reviewed}
                    onChange={(e) => setReviewed(e.target.checked)}
                    disabled={!!busy || !settings?.horoscope_enabled}
                  />
                  I have reviewed the values, corrected uncertain entries and
                  confirmed my sharing choices. These are my recorded details;
                  this does not certify astrological accuracy.
                </label>
                <Button
                  className="mt-4 w-full bg-primary-dark hover:bg-primary-dark sm:w-auto"
                  disabled={!!busy || !reviewed || !settings?.horoscope_enabled}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {extraction
                    ? "Confirm & Save extracted details"
                    : "Confirm & Save horoscope"}
                </Button>
              </div>
            </form>
          )}
          {!member && (
            <section className={card}>
              <h2 className="flex items-center gap-2 font-headline text-2xl">
                <Upload className="h-5 w-5" />
                Upload & review a chart
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                JPG, PNG or unencrypted PDF, up to 3 MB and five pages. Convert
                HEIC to JPG first. Private source files expire after the
                configured retention period. OCR can misread Tamil, handwriting,
                tilted or low-resolution charts; every value needs your review.
                Malware scanning and measured OCR accuracy have not been
                validated for release.
              </p>
              <label className="mt-4 block text-sm font-semibold">
                Chart file
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className={input}
                  disabled={!!busy || !settings?.horoscope_upload_enabled}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <Button
                className="mt-3"
                variant="outline"
                disabled={
                  !file || !!busy || !settings?.horoscope_upload_enabled
                }
                onClick={() => void run("Uploading", upload)}
              >
                Upload privately
              </Button>
              <label className="mt-5 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  checked={processingConsent}
                  onChange={(e) => setProcessingConsent(e.target.checked)}
                />
                For this extraction session, I consent to Google Gemini
                processing my source chart, which may include birth details.
                Processing is optional; enter details manually instead. The
                provider’s retention terms must be reviewed before rollout.
              </label>
              <ul className="mt-5 space-y-3">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0 text-sm">
                      <p>
                        {d.mime_type} ·{" "}
                        {new Date(d.expires_at) <= new Date()
                          ? "Expired"
                          : d.processing_state.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Access expires{" "}
                        {new Date(d.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          !!busy ||
                          !processingConsent ||
                          !settings?.horoscope_upload_enabled ||
                          new Date(d.expires_at) <= new Date()
                        }
                        onClick={() =>
                          void run("Processing chart", () => extract(d.id))
                        }
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Extract & review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() =>
                          void run("Deleting source", async () => {
                            await api("/documents", {
                              method: "DELETE",
                              body: JSON.stringify({ id: d.id }),
                            });
                            setDocuments((ds) =>
                              ds.filter((x) => x.id !== d.id),
                            );
                            setExtraction(null);
                            setSourceUrl("");
                            setMessage(
                              "Source and unconfirmed extraction removed. Saved horoscope values remain; use Delete horoscope to remove those.",
                            );
                          })
                        }
                      >
                        Delete source
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {extraction && !member && (
            <section className={card}>
              <h2 className="font-headline text-2xl">Needs review</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Confidence is a model assessment, not measured accuracy. Check
                the source beside each candidate. Applying a candidate only
                updates the draft; it does not save or publish it.
              </p>
              {extraction.payload.warnings.map((w, i) => (
                <p key={i} className="mt-2 text-sm text-amber-900">
                  {w}
                </p>
              ))}
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Open private source (link expires in 60 seconds)
                    </a>
                  )}
                  {sourceUrl &&
                    (sourceMime === "application/pdf" ? (
                      <iframe
                        title="Private source document"
                        sandbox=""
                        src={sourceUrl}
                        className="mt-3 h-[500px] w-full rounded-xl border"
                      />
                    ) : (
                      <img
                        alt="Private original horoscope source for review"
                        src={sourceUrl}
                        className="mt-3 h-auto max-w-full rounded-xl border"
                      />
                    ))}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Keep the source open alongside this review. Re-run
                    extraction to obtain a fresh source link.
                  </p>
                </div>
                <div className="space-y-3">
                  {extraction.payload.fields.map((c) => (
                    <div
                      key={c.field}
                      className="rounded-xl border p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {fieldDefinitions.find((f) => f[0] === c.field)?.[1]} ·{" "}
                        {c.confidence === "not_found"
                          ? "Not found"
                          : "Needs review · " + c.confidence}
                      </p>
                      <p className="mt-1 break-words">
                        Candidate: {c.value || "—"}
                      </p>
                      <blockquote className="mt-2 break-words text-xs text-muted-foreground">
                        Page {c.page || "?"}:{" "}
                        {c.excerpt || "No legible source found."}
                      </blockquote>
                      <Button
                        size="sm"
                        className="mt-2"
                        type="button"
                        variant="outline"
                        disabled={!c.value || !!busy}
                        onClick={() => {
                          change(c.field, c.value || "");
                          setPreview(false);
                          setMessage(
                            "Candidate copied into the form. Review and correct it before Confirm & Save.",
                          );
                        }}
                      >
                        Use in draft
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
          {member && record && (
            <section className={card}>
              <h2 className="font-headline text-2xl">Compare horoscopes</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Both members must permit reciprocal access and comparisons. Only
                selected shared fields enter the report. Traditional scoring is
                unavailable until independently validated rules are installed.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  disabled={!!busy || !settings?.horoscope_enabled}
                  onClick={() =>
                    void run("Comparing shared fields", () => compare())
                  }
                >
                  Compare Horoscopes
                </Button>
                <Button
                  variant="outline"
                  disabled={!!busy || !settings?.ai_horoscope_matching_enabled}
                  onClick={() =>
                    void run("Generating AI explanation", () => compare(true))
                  }
                >
                  Request AI explanation
                </Button>
              </div>
              {comparison && (
                <div className="mt-5 space-y-4">
                  <h3 className="font-semibold">
                    Traditional rule result: unavailable
                  </h3>
                  <p className="text-sm">
                    No compatibility score or prediction has been calculated.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr>
                          <th className="p-2">Field</th>
                          <th className="p-2">You shared</th>
                          <th className="p-2">Member shared</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          comparison.comparison as {
                            criteria: {
                              field: string;
                              label: string;
                              first: string | null;
                              second: string | null;
                            }[];
                          }
                        ).criteria.map((c) => (
                          <tr key={c.field} className="border-t">
                            <th className="p-2 font-normal">{c.label}</th>
                            <td className="break-words p-2">
                              {c.first || "Unknown / hidden"}
                            </td>
                            <td className="break-words p-2">
                              {c.second || "Unknown / hidden"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm">
                    {
                      (comparison.comparison as { completeness: string })
                        .completeness
                    }
                  </p>
                  {comparison.aiExplanation ? (
                    <>
                      <h3 className="font-semibold">
                        AI explanation · May contain errors
                      </h3>
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {
                          (comparison.aiExplanation as { explanation: string })
                            .explanation
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      AI explanation was not requested.
                    </p>
                  )}
                  <h3 className="font-semibold">
                    Questions for an independent review
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {(
                      comparison.comparison as { questions: string[] }
                    ).questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    {comparison.notice as string}
                  </p>
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() =>
                      void run("Rechecking download permission", async () => {
                        const fresh = await api("/compare", {
                          method: "POST",
                          body: JSON.stringify({ member, ai: false }),
                        });
                        download(fresh, "horoscope-comparison.json");
                      })
                    }
                  >
                    Download fresh comparison
                  </Button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

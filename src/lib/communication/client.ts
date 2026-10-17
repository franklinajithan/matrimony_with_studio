export async function communicate<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const r = await fetch("/api/communication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const d = await r.json();
  if (!r.ok)
    throw new Error(d.error || "Communication unavailable. Please retry.");
  return d as T;
}

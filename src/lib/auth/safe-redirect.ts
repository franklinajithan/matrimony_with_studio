const FALLBACK = "/dashboard";

const BLOCKED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "//",
];

/**
 * Only allow in-app relative paths. Rejects protocol-relative and external URLs.
 */
export function safeInternalPath(
  candidate: string | string[] | null | undefined,
  fallback: string = FALLBACK
): string {
  const raw = Array.isArray(candidate) ? candidate[0] : candidate;
  if (!raw || typeof raw !== "string") return fallback;

  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("://") || path.includes("\\")) return fallback;
  if (/[\x00-\x1f]/.test(path)) return fallback;

  const pathname = path.split("?")[0].split("#")[0];
  if (BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return fallback;
  }

  return path;
}

export function loginUrl(next?: string | null): string {
  if (!next) return "/login";
  const safe = safeInternalPath(next, "");
  if (!safe) return "/login";
  return `/login?next=${encodeURIComponent(safe)}`;
}

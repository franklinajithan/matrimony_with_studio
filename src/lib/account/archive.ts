/** POSIX ustar entries use generated ASCII names, never member filenames. */
export function tarHeader(name: string, size: number): Uint8Array {
  if (
    !/^[a-zA-Z0-9_./-]{1,99}$/.test(name) ||
    name.startsWith("/") ||
    name.split("/").includes("..")
  )
    throw new Error("Invalid archive entry");
  if (!Number.isSafeInteger(size) || size < 0 || size > 0o77777777777)
    throw new Error("Invalid archive size");
  const header = Buffer.alloc(512);
  const put = (value: string, at: number, length: number) =>
    header.write(value, at, length, "ascii");
  const octal = (value: number, width: number) =>
    value.toString(8).padStart(width - 1, "0") + "\0";
  put(name, 0, 100);
  put(octal(0o600, 8), 100, 8);
  put(octal(0, 8), 108, 8);
  put(octal(0, 8), 116, 8);
  put(octal(size, 12), 124, 12);
  put(octal(Math.floor(Date.now() / 1000), 12), 136, 12);
  header.fill(32, 148, 156);
  put("0", 156, 1);
  put("ustar\0", 257, 6);
  put("00", 263, 2);
  put(
    header
      .reduce((sum, byte) => sum + byte, 0)
      .toString(8)
      .padStart(6, "0") + "\0 ",
    148,
    8,
  );
  return header;
}
export async function* tarEntry(name: string, bytes: Uint8Array) {
  yield tarHeader(name, bytes.byteLength);
  yield bytes;
  const padding = (512 - (bytes.byteLength % 512)) % 512;
  if (padding) yield new Uint8Array(padding);
}
export const exportDatasets = [
  "profile",
  "settings",
  "future_map",
  "plan_shares",
  "family_invitations",
  "family_activity",
  "support_tickets",
  "support_messages",
  "sent_messages",
  "sent_interests",
  "notices",
  "subscriptions",
  "trials",
  "calls",
  "attachments",
  "biodata_documents",
  "biodata_shares",
  "profile_shares",
  "shortlist",
  "files",
] as const;
export type ExportPage = {
  rows: Record<string, unknown>[];
  next: string | null;
};
type Source = {
  page: (dataset: string, after: string | null) => Promise<ExportPage>;
  download: (bucket: string, path: string) => Promise<Uint8Array>;
  memberId: string;
  signal: AbortSignal;
};
/** One DB page/file in memory; unavailable data and limits are explicit in the final manifest. */
export async function* accountArchive(source: Source) {
  const startedAt = new Date().toISOString(),
    deadline = Date.now() + 120_000,
    maxBytes = 250 * 1024 * 1024;
  let total = 0;
  const counts: Record<string, number> = {},
    issues: { dataset: string; after: string | null; error: string }[] = [];
  const files: { path: string; archivedAs?: string; status: string }[] = [];
  const encode = (value: unknown) =>
    new TextEncoder().encode(JSON.stringify(value, null, 2));
  yield* tarEntry(
    "README.txt",
    new TextEncoder().encode(
      "CupidMatch private account export\nRecords are paginated JSON files. manifest.json maps original files to generated archive names.\nAlways check complete in manifest.json. Missing manifest means interrupted and incomplete.\nThis collection is not a transactionally consistent snapshot: edits during download may differ.\nRestricted safety/staff records, other members private messages, removed attachments and external images are excluded.\nContains private information and active share links: store securely. Retry from settings if incomplete.\n",
    ),
  );
  for (const dataset of exportDatasets) {
    let after: string | null = null,
      pageNumber = 0;
    counts[dataset] = 0;
    try {
      do {
        source.signal.throwIfAborted();
        if (Date.now() > deadline || total >= maxBytes || pageNumber >= 1000)
          throw new Error(
            "Export limit reached. Contact support for a larger export.",
          );
        const page = await source.page(dataset, after);
        if (
          !Array.isArray(page.rows) ||
          page.rows.length > 100 ||
          (page.next && page.next === after)
        )
          throw new Error("Invalid export page. Retry or contact support.");
        const data = encode(page.rows);
        if (
          data.byteLength > 10 * 1024 * 1024 ||
          total + data.byteLength > maxBytes
        )
          throw new Error("Data page exceeds archive limit. Contact support.");
        total += data.byteLength;
        yield* tarEntry(
          "records/" + dataset + "-" + ++pageNumber + ".json",
          data,
        );
        counts[dataset] += page.rows.length;
        if (dataset === "files")
          for (const item of page.rows) {
            source.signal.throwIfAborted();
            const path = String(item.path),
              bucket = String(item.bucket);
            if (
              !["media", "message-attachments"].includes(bucket) ||
              /[%\\\x00-\x1f]/.test(path) ||
              path
                .split("/")
                .some((part) => !part || part === "." || part === "..") ||
              (bucket === "media" &&
                !path.startsWith("users/" + source.memberId + "/"))
            )
              throw new Error("Invalid owned file inventory.");
            const size = Number(item.size);
            if (
              !Number.isFinite(size) ||
              size <= 0 ||
              size > 10 * 1024 * 1024 ||
              total + size > maxBytes ||
              Date.now() > deadline ||
              files.length >= 2000
            ) {
              files.push({
                path,
                status: "not included: size, time or archive limit",
              });
              continue;
            }
            try {
              const bytes = await source.download(bucket, path);
              if (
                bytes.byteLength !== size ||
                bytes.byteLength > 10 * 1024 * 1024
              )
                throw new Error("File changed");
              const archivedAs = "files/" + bucket + "/" + item.id + ".bin";
              yield* tarEntry(archivedAs, bytes);
              total += bytes.byteLength;
              files.push({ path, archivedAs, status: "included" });
            } catch {
              source.signal.throwIfAborted();
              files.push({
                path,
                status: "not included: missing, changed or unavailable",
              });
            }
          }
        after = page.next;
      } while (after);
    } catch (error) {
      source.signal.throwIfAborted();
      issues.push({
        dataset,
        after,
        error: error instanceof Error ? error.message : "Dataset unavailable",
      });
    }
  }
  yield* tarEntry(
    "manifest.json",
    encode({
      format: 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      complete:
        issues.length === 0 &&
        files.every((file) => file.status === "included"),
      counts,
      bytesIncluded: total,
      issues,
      files,
      exclusions: [
        "Restricted safety/staff records",
        "Other members private messages",
        "Removed attachments",
        "External images",
      ],
    }),
  );
  yield new Uint8Array(1024);
}

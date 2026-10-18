export const attachmentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export function validAttachment(bytes: Uint8Array, type: string) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return false;
  const starts = (seq: number[]) => seq.every((b, i) => bytes[i] === b);
  if (type === "image/jpeg") return starts([255, 216, 255]);
  if (type === "image/png") return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (type === "image/webp")
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  if (type === "application/pdf")
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  return false;
}

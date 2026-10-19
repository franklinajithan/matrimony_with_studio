import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
export const MAX_BYTES = 3 * 1024 * 1024;
export async function validateDocument(bytes: Buffer, mime: string) {
  if (!bytes.length || bytes.length > MAX_BYTES)
    throw new Error("Invalid file: maximum 3 MB.");
  if (
    mime === "application/pdf" &&
    bytes.subarray(0, 5).toString() === "%PDF-"
  ) {
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (doc.getPageCount() < 1 || doc.getPageCount() > 5) throw new Error();
      return;
    } catch {
      throw new Error(
        "Invalid PDF: use an unencrypted document with one to five pages.",
      );
    }
  }
  const jpeg =
    mime === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const png =
    mime === "image/png" &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!jpeg && !png)
    throw new Error(
      "Invalid file. Use JPG, PNG or PDF. Convert HEIC to JPG first.",
    );
  try {
    const image = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: 24000000,
    });
    const metadata = await image.metadata();
    if ((metadata.pages || 1) !== 1) throw new Error();
    await image
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();
  } catch {
    throw new Error(
      "Invalid or oversized image. Use a single-page JPG/PNG under 24 megapixels.",
    );
  }
}
export async function prepareForVision(bytes: Buffer, mime: string) {
  if (mime === "application/pdf") return { bytes, mime };
  // Retain the original privately; auto-orient, resize and strip metadata only in the provider copy.
  const prepared = await sharp(bytes, {
    failOn: "warning",
    limitInputPixels: 24000000,
  })
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 95 })
    .toBuffer();
  return { bytes: prepared, mime: "image/jpeg" };
}

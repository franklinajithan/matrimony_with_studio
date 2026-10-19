import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { validateDocument, prepareForVision } from "./files";
test("rejects empty, unsupported and fake image payloads", async () => {
  for (const [bytes, mime] of [
    [Buffer.alloc(0), "image/jpeg"],
    [Buffer.from("not a file"), "image/heic"],
    [Buffer.from([255, 216, 255]), "image/jpeg"],
    [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"],
  ] as const)
    await assert.rejects(validateDocument(bytes, mime));
});
test("accepts decoded PNG and strips metadata in provider copy", async () => {
  const image = await sharp({
    create: { width: 24, height: 32, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await validateDocument(image, "image/png");
  const prepared = await prepareForVision(image, "image/png");
  assert.equal(prepared.mime, "image/jpeg");
  assert.equal((await sharp(prepared.bytes).metadata()).exif, undefined);
});
test("rejects empty and more than five-page PDFs", async () => {
  const empty = await PDFDocument.create();
  await assert.rejects(
    validateDocument(
      Buffer.from(await empty.save({ addDefaultPage: false })),
      "application/pdf",
    ),
  );
  const large = await PDFDocument.create();
  for (let i = 0; i < 6; i++) large.addPage();
  await assert.rejects(
    validateDocument(Buffer.from(await large.save()), "application/pdf"),
  );
});
test("accepts five-page PDF without image conversion", async () => {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 5; i++) pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  await validateDocument(bytes, "application/pdf");
  assert.deepEqual(await prepareForVision(bytes, "application/pdf"), {
    bytes,
    mime: "application/pdf",
  });
});

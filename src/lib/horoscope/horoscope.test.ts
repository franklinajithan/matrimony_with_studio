import { test } from "node:test";
import assert from "node:assert/strict";
import { saveSchema, extractionSchema } from "./schema";
import { compareSharedFields } from "./comparison";
const valid = {
  revision: 0,
  tradition: "tamil",
  visibility: "private",
  fields: {
    dateOfBirth: "1990-06-15",
    timeQuality: "unknown",
    birthCity: "London",
    birthCountry: "UK",
    timezone: "Europe/London",
    language: "Tamil",
  },
  shared_fields: [],
  comparison_consent: false,
  ai_consent: false,
  planets: [],
};
test("unknown birth time saves without fabricated time or lagna", () => {
  assert.equal(saveSchema.safeParse(valid).success, true);
});
test("unknown time rejects hidden time-sensitive facts", () => {
  for (const patch of [{ timeOfBirth: "12:00" }, { lagna: "Mesha" }])
    assert.equal(
      saveSchema.safeParse({ ...valid, fields: { ...valid.fields, ...patch } })
        .success,
      false,
    );
});
test("missing/invalid birth date and impossible leap dates rejected", () => {
  for (const dateOfBirth of ["", "1991-02-29", "12/04/1990", "2990-01-01"])
    assert.equal(
      saveSchema.safeParse({
        ...valid,
        fields: { ...valid.fields, dateOfBirth },
      }).success,
      false,
    );
});
test("timezone and time precision validated", () => {
  assert.equal(
    saveSchema.safeParse({
      ...valid,
      fields: { ...valid.fields, timezone: "Not/AZone" },
    }).success,
    false,
  );
  assert.equal(
    saveSchema.safeParse({
      ...valid,
      fields: { ...valid.fields, timeQuality: "exact" },
    }).success,
    false,
  );
});
test("planetary duplicate/sign/degree validation", () => {
  const p = { planet: "Sun", chart: "D1", sign: 1 };
  assert.equal(
    saveSchema.safeParse({ ...valid, planets: [p, p] }).success,
    false,
  );
  assert.equal(
    saveSchema.safeParse({ ...valid, planets: [{ ...p, degrees: 30 }] })
      .success,
    false,
  );
});
test("arbitrary fields and consent coercion rejected", () => {
  assert.equal(
    saveSchema.safeParse({ ...valid, ai_consent: "true" }).success,
    false,
  );
  assert.equal(
    saveSchema.safeParse({
      ...valid,
      fields: { ...valid.fields, gender: "male" },
    }).success,
    false,
  );
});
test("extracted facts require source excerpt and page", () => {
  assert.equal(
    extractionSchema.safeParse({
      fields: [
        {
          field: "rasi",
          value: "Mesha",
          confidence: "high",
          excerpt: "",
          page: null,
        },
      ],
      warnings: [],
    }).success,
    false,
  );
});
test("duplicate and malformed extraction rejected", () => {
  const c = {
    field: "rasi",
    value: null,
    confidence: "not_found",
    excerpt: "",
    page: null,
  };
  assert.equal(
    extractionSchema.safeParse({ fields: [c, c], warnings: [] }).success,
    false,
  );
  assert.equal(
    extractionSchema.safeParse({
      fields: [{ ...c, field: "gender" }],
      warnings: [],
    }).success,
    false,
  );
});
test("different traditions never yield a numeric score", () => {
  const r = compareSharedFields(
    { tradition: "tamil", fields: { rasi: "Mesha" } },
    { tradition: "western", fields: { rasi: "Aries" } },
  );
  assert.equal(r.traditionalResult.score, null);
  assert.equal(r.tradition, "different");
});
test("hidden/unknown time excludes lagna comparison", () => {
  const r = compareSharedFields(
    { tradition: "tamil", fields: { lagna: "Mesha", timeQuality: "exact" } },
    { tradition: "tamil", fields: { lagna: "Simha" } },
  );
  assert.equal(r.criteria.find((x) => x.field === "lagna")?.status, "excluded");
  assert.equal(r.criteria.find((x) => x.field === "lagna")?.first, null);
});

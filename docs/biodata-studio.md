# Biodata Studio

Marriage biodata documents for CupidMatch members — draft, customise templates, preview, and export.

## Routes

| Path | Purpose |
|------|---------|
| `/biodata` | Studio home — create, drafts, favourites |
| `/biodata/templates` | Gallery of 20 templates |
| `/biodata/[id]/edit` | Document editor |
| `/biodata/[id]/preview` | Preview and export |
| `/share/biodata/[token]` | Optional public share snapshot (noindex) |
| `/dashboard/biodata` | Redirects to `/biodata` |

Authenticated via middleware (`/biodata`). Uses `DashboardShell` (sidebar + mobile bottom nav). Biodata Studio appears under Account in the desktop sidebar and from Profile / My profile.

## Migration

Apply once (already applied on the project DB if you ran the setup script):

```bash
node scripts/apply-biodata-migration.mjs
```

SQL source: `supabase/fixups/create-biodata-studio.sql`

Tables (owner-scoped RLS):

- `biodata_documents`
- `biodata_template_favourites`
- `biodata_share_links`

## Features

- Import from the member’s profile snapshot (does not write back to profile)
- 20 distinct templates (religious art optional and user-toggled only)
- EN / TA / SI **labels** (not full document translation) with Noto Sans Tamil / Sinhala
- Debounced autosave, undo/redo, template switch without losing content
- Privacy review before export (photo, DOB, contacts, religious/horoscope)
- PDF / PNG / JPEG / Print (client-side via html2canvas + jsPDF; PDF pages are rasterized images — selectable-text PDF is a known limitation)
- Optional AI rewrite of introduction text via `POST /api/biodata/assist` (requires Genkit/Google AI key; returns 503 when unavailable)

## Configuration

- Supabase URL + anon key (existing)
- Optional: `GEMINI_API_KEY` / Genkit Google AI for assist

## Limitations

- PDF export is image-based (html2canvas), not embedded selectable text
- Family/contact fields must be entered in the document if not on the profile
- Share links require creating a link from the app; downloaded files cannot be revoked
- Multi-page PNG/JPEG downloads as sequential files (not ZIP unless jszip is added later)

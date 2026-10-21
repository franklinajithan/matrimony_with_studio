# Royal Cupid theme

The application theme is defined once in `src/app/globals.css`, with semantic
Tailwind names in `tailwind.config.ts`. Use `primary` for actions, `primary-dark`
for hover and dark panels, `background` / `card` for ivory surfaces, `accent` /
`muted` for lavender, `foreground` and `muted-foreground` for copy. Use `gold`
for decorative details, `gold-foreground` for gold text on light surfaces, and
`gold-light` on dark panels. Do not use decorative gold for small text or white
text on gold. Shared controls inherit these tokens, including portal dialogs.

## Route coverage

All page and layout files under `src/app` and UI files under `src/components`
were inspected for colour overrides. API routes, permissions and authentication
logic are unchanged. The following groups use the common theme:

| Route group | Theme entry points |
| --- | --- |
| Home, about, features, blog, contact, safety, stories, legal pages | Root tokens; Navbar, Footer, PublicPage; landing sections |
| Login, signup, email confirmation, forgot/reset password | Auth layout and shared Card/Input/Button/Alert |
| Dashboard, profile editing, preferences, privacy, profile views | DashboardShell, DashboardOverview, PageHero, shared controls |
| Discover, suggestions, interests, connections, member profiles | Member shell, discovery components, profile controls |
| Biodata studio, gallery, editor, preview and sharing | Studio UI, shared controls, public share wrapper |
| Horoscope and horoscope privacy | HoroscopeStudio, HoroscopeChart, member shell |
| Messages and conversation routes | MessagesWorkspace and member shell |
| Pricing, launch pricing, membership, settings, verification, onboarding | Shared tokens and controls; OnboardingWizard |
| Admin overview, members/editing, verification, plans, trials, promo codes, stories, registration, horoscope, security | Admin layout/navigation/mobile bar, tables, forms and shared controls |

Provider trademarks and the existing CupidMatch logo are preserved. Member-chosen
biodata document palettes and the standalone social metadata images retain their
literal colours; changing the app theme must not recolour an exported document
or break Satori rendering. Semantic success, warning, information and destructive
states retain their meaning rather than becoming brand colours.

## Hero

The existing optimized WebP remains the sole hero image. Desktop uses 42/58
columns and a 1.4 image frame, moving the portrait up and increasing its apparent
size by approximately 24% at typical desktop widths. Mobile uses a 1.12 frame
and a separate object position; tablet uses a 1.5 frame. Gradient overlays blend
all edges into ivory. Text and links remain in normal flow above the mobile
portrait. `next/image` priority and responsive sizes are retained.

## Verification

Run `npm run check`, `npm run build`, `npm run test:admin`,
`npm run test:horoscope`, and `node --test scripts/theme-contrast.test.mjs`.
The contrast test checks actual semantic CSS tokens, including normal text,
primary/destructive buttons, secondary labels, field borders and focus rings.

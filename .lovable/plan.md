# Plan: "Book on Official Site" Deep Links

## 1. Data layer (`src/lib/parks.ts`)
- Extend `Park` type with `official_url: string` and `booking_url: string`.
- In `fetchAll()`, map `p.official_url` and `p.booking_url` from `parks_master` rows (using existing `s()` helper so nulls become `""`).

## 2. Trip selection state (global, in `src/routes/index.tsx`)
Add a single `trip` state object — currently the app has no date or party-size UI:
```ts
type TripSelection = { from: string; to: string; adults: number; children: number; animals: number };
```
Defaults: empty dates, `adults: 2`, `children: 0`, `animals: 0`. Persist to `localStorage` so the selection survives reloads.

Render a compact **Trip bar** in the header (below the search row, above filters or alongside the Filters button on desktop):
- Two native `<input type="date">` fields (From / To) — keeps mobile UX native and avoids new dialog plumbing.
- Three small number steppers: Adults, Children, Pets.
- On mobile, collapse into a "Trip" pill button that opens a Sheet/Popover with the same controls.

Pass `trip` down to `ParkDetailPanel`.

## 3. New helper + component
Create `src/lib/booking.ts`:
```ts
export function buildBookingUrl(bookingUrl, { from, to, adults=2, children=0, animals=0 }) { ... }
```
Use `URLSearchParams` exactly as in the spec. `booking_url` already ends in `/`, so append `?` directly.

Create `src/components/ParkBookingButtons.tsx`:
- Props: `{ park, trip }`.
- Renders up to two buttons inside a `flex gap-2`:
  - **Book this park** (primary, `Button` default variant) — only if `park.booking_url`.
    - If `trip.from` and `trip.to` are both set → `<a href={buildBookingUrl(...)}>`.
    - If dates missing → render a disabled button with a tooltip "Select dates to book" (use existing `Tooltip` component).
  - **View park page** (secondary, `Button variant="outline"`) — only if `park.official_url`.
- Both anchors: `target="_blank"`, `rel="noopener noreferrer"`, with an `ExternalLink` icon.
- If both URLs missing: render a muted `No official link available` line.

## 4. Wire into `ParkDetailPanel`
- Add `trip: TripSelection` prop, thread it through `PanelContent`.
- Insert `<ParkBookingButtons park={park} trip={trip} />` directly above the existing "Add personal field notes" button so booking is the primary action when the panel opens.

## 5. Edge cases (per spec)
- Either URL null → hide that button.
- Both null → muted note.
- Dates not selected → Book button disabled with tooltip (preferred over linking bare URL).
- Date format strictly `YYYY-MM-DD` (the native date input already returns this; no locale conversion).

## 6. Out of scope
- No schema changes (columns already exist).
- No changes to map markers or list rows — booking actions live in the detail panel only.
- No analytics/tracking on click.

## Files touched
- `src/lib/parks.ts` — add two fields to `Park` + mapping.
- `src/lib/booking.ts` — new, `buildBookingUrl`.
- `src/components/ParkBookingButtons.tsx` — new.
- `src/components/ParkDetailPanel.tsx` — render booking buttons, accept `trip` prop.
- `src/routes/index.tsx` — trip state + header trip bar + pass `trip` to panel.

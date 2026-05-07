## Goal

Replace the static `parks.json` snapshot with a live Google Sheets integration so the app always reflects the current state of your sheet, and personal field notes write back to the `reviews_personal` tab.

## How it works

```text
Browser ──▶ /api/sheets/parks    ──▶ Google Sheets gateway ──▶ parks_master tab
Browser ──▶ /api/sheets/reviews  ──▶ Google Sheets gateway ──▶ reviews_community tab
Browser ──▶ POST /api/sheets/personal ──▶ append row ──▶ reviews_personal tab
```

All Sheets calls happen server-side through Lovable's connector gateway (your OAuth credentials never touch the browser).

## Steps

1. **Connect Google Sheets** — prompt to link the connector to this project (read + write scope).
2. **Create three server routes** under `src/routes/api/sheets/`:
   - `GET /api/sheets/parks` — fetches `parks_master` range, parses headers, returns typed `Park[]`.
   - `GET /api/sheets/reviews` — fetches `reviews_community`, returns `Review[]`.
   - `POST /api/sheets/personal` — validates body with Zod, appends a row to `reviews_personal` with the columns: `entry_id, park_id, park_name, stay_start, site_number, wifi_quality, rating_overall, notes, created_at`.
3. **Geocoding** — `parks_master` doesn't have lat/lon, so the server route enriches missing coords using OpenStreetMap Nominatim and caches results in-memory per server instance (5-min TTL).
4. **Client data layer** — replace `src/data/parks.json` + the static exports in `src/lib/parks.ts` with React Query hooks: `useParks()`, `useReviews()`, `useAddPersonalReview()`. Cache for 60s with manual "Refresh" button in the header.
5. **Personal reviews** — `PersonalReviewForm` posts to `/api/sheets/personal`; on success, invalidate the personal-reviews query. Keep localStorage as an offline fallback when the request fails.
6. **Loading / error UI** — skeleton on the map + list while the first fetch resolves; toast + retry button on failure.
7. **Header refresh control** — small "Synced X min ago · Refresh" indicator that re-fetches both sheets.

## Sheet assumptions

- `parks_master` first row contains headers matching the `Park` type fields. If a column is renamed, the parser logs which header it couldn't map.
- `reviews_personal` tab exists with the 9 columns listed above. If it doesn't, the first POST creates the header row.

## Technical details

- Server routes call `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/{id}/values/{range}` with `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${GOOGLE_SHEETS_API_KEY}`.
- Spreadsheet ID `13eLALZ_RDVGXf_QgnblMi-nYhXsbnxCr2ruqNDpACuc` is hardcoded in a server-only constants file.
- Append uses `POST .../values/reviews_personal!A:I:append?valueInputOption=USER_ENTERED`.
- React Query is already in the project (`__root.tsx` provides `QueryClientProvider`).
- No client bundle changes for secrets — everything authenticated stays in server routes.

## Out of scope

- Background scheduled sync (still on-demand / per-load).
- Conflict handling if two devices submit the same `entry_id` (very unlikely with timestamp IDs).
- Authentication — the app remains single-user, your sheet is the source of truth.
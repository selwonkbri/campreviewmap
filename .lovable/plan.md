## Migrate backend from Google Sheets to Lovable Cloud (Supabase)

### 1. Enable Lovable Cloud
Provisions Postgres, auth, and the server-side Supabase clients. No Google Sheets calls after this is done.

### 2. Create three tables (via migration)

**`parks`** — one row per park
- `park_id` (text, primary key) — keep existing IDs like `TT-NW-001`
- `park_name`, `membership_type`, `state`, `city`, `region`, `address` (text)
- `lat`, `lon` (double precision, nullable)
- `big_rig_friendly`, `cell_quality`, `key_amenities`, `nearby_highlights`, `notes` (text)
- `last_updated` (timestamptz, default now())

**`reviews_community`** — scraped/aggregated reviews
- `review_id` (text, primary key)
- `park_id` (text, FK → parks)
- `park_name`, `source_type`, `source_url`, `sentiment`, `big_rig_flag`, `tags`, `summary`, `raw_quote` (text)
- `review_date` (date)

**`reviews_personal`** — your field notes
- `entry_id` (uuid, default gen_random_uuid(), primary key)
- `park_id` (text, FK → parks)
- `park_name` (text)
- `stay_start`, `stay_end` (date, nullable)
- `rating_overall`, `rating_sites`, `rating_amenities`, `rating_cell` (numeric, nullable)
- `big_rig_verdict`, `tags`, `notes` (text)
- `created_at` (timestamptz, default now())

### 3. RLS policies
Per your choice (no auth required for personal reviews):
- `parks` and `reviews_community`: public SELECT only.
- `reviews_personal`: public SELECT and public INSERT, no UPDATE/DELETE from clients.

### 4. One-time data import
Run a server function (admin client) that:
1. Fetches `parks_master`, `reviews_community`, `reviews_personal` from the live Google Sheet using the existing connector.
2. Upserts into the three Supabase tables.
3. Reports counts back to me. I'll run it once, confirm row counts, then we delete the import endpoint.

Coordinates fallback (`src/data/coords-cache.json`) is applied during the import for parks with empty GPS, then the cache file is deleted.

### 5. Replace the data layer
- Rewrite `src/routes/api/sheets.ts` → `src/routes/api/data.ts` (or delete it and use `createServerFn`s) backed by Supabase.
- Update `src/lib/parks.ts`:
  - `useSheets()` → `useParksData()` reading from Supabase via a server fn (parks + community + personal in one call).
  - `useAddPersonalReview()` → inserts into `reviews_personal` via Supabase.
- `PersonalReviewForm` and `ParkDetailPanel` keep their current props/shape — only the data source changes.
- Header "Sync" indicator stays but now reflects the React Query fetch time against Supabase.

### 6. Disconnect Google Sheets
- Remove the `google_sheets` connector usage from code.
- Delete `src/data/coords-cache.json` and `src/data/parks.json` once the import is verified.
- Remove `GOOGLE_SHEETS_API_KEY` from secrets.

### Result
- App reads/writes against Supabase only.
- Field-note submissions persist instantly with no third-party dependency.
- Schema mirrors the current sheet, so the UI and types barely change.

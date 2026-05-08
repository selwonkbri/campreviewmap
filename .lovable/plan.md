## Findings

- **Google Sheets connection found:** "Brian's Google Sheets" (`std_01kr1gcks2ejytxm9e2r8904xn`)
- **Status:** Linkable, you have access, but **not yet linked to this project**
- **Spreadsheet ID** (from your URL): `13eLALZ_RDVGXf_QgnblMi-nYhXsbnxCr2ruqNDpACuc`
- **Verification:** Cannot verify `parks_master` / `reviews_community` / `reviews_personal` tabs until the connection is linked — gateway calls require the project-scoped API key.

## Next steps (on approval)

1. Link "Brian's Google Sheets" to this project via the connector picker.
2. Hit the gateway to confirm the spreadsheet is reachable and list its tabs:
   - `GET /v4/spreadsheets/13eLALZ_RDVGXf_QgnblMi-nYhXsbnxCr2ruqNDpACuc?fields=sheets.properties.title`
3. Pull the header row from each tab to confirm column names match the `Park` / `Review` types in `src/lib/parks.ts`:
   - `parks_master!1:1`
   - `reviews_community!1:1`
   - `reviews_personal!1:1` (create with the 9-column header if missing)
4. Report back: tab list, header diffs (if any), and whether `reviews_personal` exists.

No code changes happen in this step — it's purely the link + read-only verification so we know the live integration will work before wiring up the server routes.
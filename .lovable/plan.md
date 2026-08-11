# Remove Harvest Host listings from the map

## Current state
The app fetches all rows from `parks_master` in `src/lib/parks.ts` and renders every park with coordinates on the map. The external Supabase table currently contains 216 rows with these `membership_type` values:
- `thousand-trails-standard`: 82
- `thousand-trails-trails-collection`: 122
- `harvest_hosts`: 7
- `private`: 4
- `family`: 1

The 7 `harvest_hosts` rows are wineries, farms, and other non-campground locations that should not appear on the campground map.

## Plan
1. **Filter at the data layer.** In `src/lib/parks.ts`, inside `fetchAll()`, drop any `parks_master` row whose `membership_type` is exactly `harvest_hosts` before mapping it into the app's `Park` type. This removes Harvest Host listings from the map, list view, detail panel, search results, and MCP tools in one place.
2. **Preserve existing behavior.** Keep all other membership types (`thousand-trails-standard`, `thousand-trails-trails-collection`, `private`, `family`) visible. Do not change the database or alter the `membershipBucket` / filter logic.
3. **Verify counts.** After the change, the app should report 209 parks total (216 − 7), and selecting "All" in the membership filter should show 209 parks. The map should no longer render the 7 Harvest Host markers.

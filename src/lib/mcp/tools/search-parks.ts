import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, json, membershipLabel, publicSupabase, sentimentSummary } from "../supabase";

export default defineTool({
  name: "search_parks",
  title: "Search campgrounds",
  description:
    "Search the Thousand Trails / Trails Collection campground database by name, state, region, membership type, or big-rig friendliness. Returns matching parks with their sentiment label.",
  inputSchema: {
    query: z.string().optional().describe("Free text matched against park name, city, and region."),
    state: z.string().optional().describe("Two-letter state code, e.g. WA."),
    membership_type: z
      .enum(["thousand-trails-standard", "thousand-trails-trails-collection"])
      .optional()
      .describe("Membership slug to filter on."),
    big_rig_friendly: z
      .enum(["yes", "no", "unknown"])
      .optional()
      .describe("Filter by big-rig friendliness flag."),
    limit: z.number().int().optional().describe("Max results, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, state, membership_type, big_rig_friendly, limit }) => {
    const supabase = publicSupabase();
    const max = Math.min(Math.max(limit ?? 25, 1), 100);

    let q = supabase
      .from("parks_master")
      .select(
        "park_id,park_name,membership_type,state,city,region,gps_lat,gps_lon,big_rig_friendly,cell_quality,official_url,booking_url",
      );
    if (state) q = q.ilike("state", state);
    if (membership_type) q = q.eq("membership_type", membership_type);
    if (big_rig_friendly) q = q.ilike("big_rig_friendly", big_rig_friendly);
    if (query) {
      const like = `%${query.replace(/[%,]/g, "")}%`;
      q = q.or(`park_name.ilike.${like},city.ilike.${like},region.ilike.${like}`);
    }

    const { data, error } = await q.limit(max);
    if (error) return fail(error.message);

    const ids = (data ?? []).map((p) => p.park_id as string);
    const { data: reviews } = await supabase
      .from("reviews_community")
      .select("park_id,sentiment")
      .in("park_id", ids.length ? ids : ["__none__"]);

    const results = (data ?? []).map((p) => ({
      ...p,
      membership_label: membershipLabel((p.membership_type as string) ?? ""),
      sentiment: sentimentSummary((reviews ?? []).filter((r) => r.park_id === p.park_id)),
    }));

    return json({ count: results.length, parks: results });
  },
});

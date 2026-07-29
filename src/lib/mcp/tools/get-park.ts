import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  bookingWindowDays,
  fail,
  json,
  membershipLabel,
  publicSupabase,
  sentimentSummary,
} from "../supabase";

export default defineTool({
  name: "get_park",
  title: "Get campground details",
  description:
    "Full detail for one campground: location, amenities, notes, big-rig warnings, booking links, reservation window, community reviews, and personal field notes. Accepts a park_id or a park name.",
  inputSchema: {
    park_id: z.string().optional().describe("Exact park_id, e.g. tt-crescent-bar."),
    park_name: z.string().optional().describe("Park name (partial match) if the id is unknown."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ park_id, park_name }) => {
    if (!park_id && !park_name) return fail("Provide park_id or park_name.");
    const supabase = publicSupabase();

    let q = supabase.from("parks_master").select("*");
    q = park_id
      ? q.eq("park_id", park_id)
      : q.ilike("park_name", `%${(park_name ?? "").replace(/[%,]/g, "")}%`);

    const { data, error } = await q.limit(1);
    if (error) return fail(error.message);
    const park = (data ?? [])[0];
    if (!park) return fail("No matching campground found.");

    const [{ data: community }, { data: personal }] = await Promise.all([
      supabase.from("reviews_community").select("*").eq("park_id", park.park_id),
      supabase.from("reviews_personal").select("*").eq("park_id", park.park_id),
    ]);

    const bigRigWarnings = (community ?? [])
      .map((r) => r.big_rig_flag as string | null)
      .filter((f) => f && !["none", "unknown", "no"].includes(f.toLowerCase()));

    return json({
      park: {
        ...park,
        membership_label: membershipLabel((park.membership_type as string) ?? ""),
        booking_window_days: bookingWindowDays((park.membership_type as string) ?? ""),
      },
      sentiment: sentimentSummary(community ?? []),
      big_rig_warnings: Array.from(new Set(bigRigWarnings)),
      community_reviews: community ?? [],
      personal_reviews: personal ?? [],
    });
  },
});

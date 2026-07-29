import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, json, publicSupabase } from "../supabase";

export default defineTool({
  name: "add_personal_review",
  title: "Add personal field note",
  description:
    "Add a personal field note / stay log for a campground (ratings, big-rig verdict, tags, raw notes). Writes to the same personal review feed shown in the app.",
  inputSchema: {
    park_id: z.string().describe("Campground park_id."),
    stay_start: z.string().optional().describe("Arrival date YYYY-MM-DD."),
    stay_end: z.string().optional().describe("Departure date YYYY-MM-DD."),
    rating_overall: z.number().optional().describe("Overall rating 1-5."),
    big_rig_verdict: z.string().optional().describe("Big-rig verdict in your own words."),
    tags: z.string().optional().describe("Comma-separated tags."),
    notes: z.string().describe("Raw field notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ park_id, stay_start, stay_end, rating_overall, big_rig_verdict, tags, notes }) => {
    const supabase = publicSupabase();
    const { data: parks, error: parkErr } = await supabase
      .from("parks_master")
      .select("park_id,park_name")
      .eq("park_id", park_id)
      .limit(1);
    if (parkErr) return fail(parkErr.message);
    const park = (parks ?? [])[0];
    if (!park) return fail("No matching campground found for that park_id.");

    const { data, error } = await supabase
      .from("reviews_personal")
      .insert({
        park_id: park.park_id,
        park_name: park.park_name,
        stay_start: stay_start || null,
        stay_end: stay_end || null,
        rating_overall: rating_overall ?? null,
        big_rig_verdict: big_rig_verdict || null,
        tags: tags || null,
        notes,
      })
      .select("entry_id")
      .single();
    if (error) return fail(error.message);
    return json({ ok: true, entry_id: data?.entry_id, park_name: park.park_name });
  },
});

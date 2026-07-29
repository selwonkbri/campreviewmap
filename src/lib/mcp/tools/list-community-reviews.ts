import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, json, publicSupabase } from "../supabase";

export default defineTool({
  name: "list_community_reviews",
  title: "List community reviews",
  description:
    "List community reviews across campgrounds, optionally filtered by park, sentiment, or a tag (tags are comma-separated text).",
  inputSchema: {
    park_id: z.string().optional().describe("Restrict to one campground."),
    sentiment: z.enum(["positive", "mixed", "negative"]).optional(),
    tag: z.string().optional().describe("Match a single tag, e.g. waterfront."),
    limit: z.number().int().optional().describe("Max results, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ park_id, sentiment, tag, limit }) => {
    const supabase = publicSupabase();
    const max = Math.min(Math.max(limit ?? 25, 1), 100);
    let q = supabase.from("reviews_community").select("*");
    if (park_id) q = q.eq("park_id", park_id);
    if (sentiment) q = q.eq("sentiment", sentiment);
    if (tag) q = q.ilike("tags", `%${tag.replace(/[%,]/g, "")}%`);
    const { data, error } = await q.limit(max);
    if (error) return fail(error.message);
    return json({ count: data?.length ?? 0, reviews: data ?? [] });
  },
});

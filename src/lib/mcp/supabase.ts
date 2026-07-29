// Public (anon) Supabase access for MCP tools.
// The MCP server is public, so tools may only use the publishable key —
// never a service-role key.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cibujcpcqfusgizdmqkr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jNCopv5ATsO5VGLjcJZ3xQ_Dad75Oh_";

export function publicSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function membershipLabel(t: string) {
  if (t === "thousand-trails-standard") return "Thousand Trails";
  if (t === "thousand-trails-trails-collection") return "Trails Collection";
  return t || "Other";
}

/** Booking window in days: Thousand Trails standard = 120, Trails Collection = 60. */
export function bookingWindowDays(membershipType: string) {
  return membershipType === "thousand-trails-trails-collection" ? 60 : 120;
}

export type ReviewRow = { sentiment?: string | null };

/** Sentiment label, biased toward "mixed" (mirrors the app's scoring rules). */
export function sentimentSummary(reviews: ReviewRow[]) {
  if (reviews.length === 0) return { label: "unknown", score: 0, count: 0 };
  const map: Record<string, number> = { positive: 1, mixed: 0, negative: -1 };
  const score = reviews.reduce((s, r) => s + (map[r.sentiment ?? ""] ?? 0), 0) / reviews.length;
  const pos = reviews.filter((r) => r.sentiment === "positive").length;
  const neg = reviews.filter((r) => r.sentiment === "negative").length;
  let label = "mixed";
  if (reviews.length < 4) {
    if (pos === reviews.length) label = "positive";
    else if (neg === reviews.length) label = "negative";
  } else if (score >= 0.6 && pos / reviews.length >= 0.6) label = "positive";
  else if (score <= -0.6 && neg / reviews.length >= 0.6) label = "negative";
  return { label, score: Number(score.toFixed(2)), count: reviews.length };
}

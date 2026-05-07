import data from "@/data/parks.json";

export type Park = {
  park_id: string;
  park_name: string;
  membership_type: string;
  state: string;
  city: string;
  region: string;
  address: string;
  lat: number | null;
  lon: number | null;
  big_rig_friendly: string;
  cell_quality: string;
  key_amenities: string;
  nearby_highlights: string;
  last_updated: string;
  notes: string;
};

export type Review = {
  review_id: string;
  park_id: string;
  park_name: string;
  source_type: string;
  source_url: string;
  review_date: string;
  sentiment: string;
  big_rig_flag: string;
  tags: string;
  summary: string;
  raw_quote: string;
};

export type PersonalReview = {
  entry_id: string;
  park_id: string;
  park_name: string;
  stay_start: string;
  site_number: string;
  wifi_quality: string;
  rating_overall: number;
  notes: string;
  created_at: string;
};

export const parks = data.parks as Park[];
export const reviews = data.reviews as Review[];

export type Sentiment = "positive" | "mixed" | "negative" | "unknown";

export function membershipLabel(t: string) {
  if (t.startsWith("TT")) return "Thousand Trails";
  if (t.toLowerCase().includes("encore")) return "Encore";
  return t || "Other";
}

export function membershipBucket(t: string): "TT" | "Encore" | "Other" {
  if (t.startsWith("TT")) return "TT";
  if (t.toLowerCase().includes("encore")) return "Encore";
  return "Other";
}

export function sentimentScore(parkId: string, allReviews: Review[]): { score: number; label: Sentiment; count: number } {
  const r = allReviews.filter((x) => x.park_id === parkId);
  if (r.length === 0) return { score: 0, label: "unknown", count: 0 };
  const map: Record<string, number> = { positive: 1, mixed: 0, negative: -1 };
  const total = r.reduce((s, x) => s + (map[x.sentiment] ?? 0), 0);
  const score = total / r.length;
  let label: Sentiment = "mixed";
  if (score > 0.33) label = "positive";
  else if (score < -0.33) label = "negative";
  return { score, label, count: r.length };
}

export function bigRigWarnings(park: Park, allReviews: Review[]) {
  const flags = allReviews
    .filter((r) => r.park_id === park.park_id && r.big_rig_flag && r.big_rig_flag !== "none")
    .map((r) => r.big_rig_flag);
  if (park.big_rig_friendly === "no") flags.unshift("Park flagged: not big-rig friendly");
  return Array.from(new Set(flags));
}

const STORAGE_KEY = "rv_personal_reviews_v1";

export function getPersonalReviews(): PersonalReview[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addPersonalReview(r: Omit<PersonalReview, "entry_id" | "created_at">) {
  const list = getPersonalReviews();
  const entry: PersonalReview = {
    ...r,
    entry_id: `P-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return entry;
}

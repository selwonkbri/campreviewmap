import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  stay_end: string;
  rating_overall: string | number;
  rating_sites?: string | number;
  rating_amenities?: string | number;
  rating_cell?: string | number;
  big_rig_verdict: string;
  tags: string;
  notes: string;
  // legacy local fields
  site_number?: string;
  wifi_quality?: string;
};

export type SheetsPayload = {
  parks: Park[];
  reviews: Review[];
  personal: PersonalReview[];
  fetched_at: string;
};

export type Sentiment = "positive" | "mixed" | "negative" | "unknown";

export function membershipLabel(t: string) {
  if (t?.startsWith("TT")) return "Thousand Trails";
  if (t?.toLowerCase().includes("encore")) return "Encore";
  return t || "Other";
}

export function membershipBucket(t: string): "TT" | "Encore" | "Other" {
  if (t?.startsWith("TT")) return "TT";
  if (t?.toLowerCase().includes("encore")) return "Encore";
  return "Other";
}

export function sentimentScore(
  parkId: string,
  allReviews: Review[],
): { score: number; label: Sentiment; count: number } {
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

const QUERY_KEY = ["sheets"] as const;

async function fetchSheets(): Promise<SheetsPayload> {
  const res = await fetch("/api/sheets");
  if (!res.ok) throw new Error(`Sheets fetch failed (${res.status})`);
  return res.json();
}

export function useSheets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSheets,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export type NewPersonalReview = {
  park_id: string;
  park_name: string;
  stay_start: string;
  stay_end?: string;
  rating_overall: number;
  big_rig_verdict?: string;
  tags?: string;
  notes: string;
};

export function useAddPersonalReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPersonalReview) => {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Save failed");
      }
      return res.json() as Promise<{ ok: boolean; entry_id: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

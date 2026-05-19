import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseExternal as supabase } from "@/integrations/supabase/external";

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

export function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
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
    .filter(
      (r) =>
        r.park_id === park.park_id &&
        r.big_rig_flag &&
        r.big_rig_flag.toLowerCase() !== "none" &&
        r.big_rig_flag.toLowerCase() !== "unknown",
    )
    .map((r) => r.big_rig_flag);
  if (park.big_rig_friendly?.toLowerCase() === "no") {
    flags.unshift("Park flagged: not big-rig friendly");
  }
  return Array.from(new Set(flags));
}

const QUERY_KEY = ["parks-data"] as const;

function s(v: unknown): string {
  return v == null ? "" : String(v);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchAll(): Promise<SheetsPayload> {
  const [parksRes, communityRes, personalRes] = await Promise.all([
    supabase.from("parks_master").select("*"),
    supabase.from("reviews_community").select("*"),
    supabase.from("reviews_personal").select("*"),
  ]);
  if (parksRes.error) throw parksRes.error;
  if (communityRes.error) throw communityRes.error;
  if (personalRes.error) throw personalRes.error;

  const parks: Park[] = (parksRes.data ?? []).map((p: Record<string, unknown>) => ({
    park_id: s(p.park_id),
    park_name: s(p.park_name),
    membership_type: s(p.membership_type),
    state: s(p.state),
    city: s(p.city),
    region: s(p.region),
    address: s(p.address),
    lat: num(p.gps_lat),
    lon: num(p.gps_lon),
    big_rig_friendly: s(p.big_rig_friendly),
    cell_quality: s(p.cell_quality),
    key_amenities: s(p.key_amenities),
    nearby_highlights: s(p.nearby_highlights),
    last_updated: s(p.last_updated),
    notes: s(p.notes),
  }));

  const reviews: Review[] = (communityRes.data ?? []).map((r: Record<string, unknown>) => ({
    review_id: s(r.review_id),
    park_id: s(r.park_id),
    park_name: s(r.park_name),
    source_type: s(r.source_type),
    source_url: s(r.source_url),
    review_date: s(r.review_date),
    sentiment: s(r.sentiment),
    big_rig_flag: s(r.big_rig_flag),
    tags: s(r.tags),
    summary: s(r.summary),
    raw_quote: s(r.raw_quote),
  }));

  const personal: PersonalReview[] = (personalRes.data ?? [])
    .map((r: Record<string, unknown>) => ({
      entry_id: s(r.entry_id),
      park_id: s(r.park_id),
      park_name: s(r.park_name),
      stay_start: s(r.stay_start),
      stay_end: s(r.stay_end),
      rating_overall: (r.rating_overall as number | string) ?? "",
      rating_sites: (r.rating_sites as number | string) ?? undefined,
      rating_amenities: (r.rating_amenities as number | string) ?? undefined,
      rating_cell: (r.rating_cell as number | string) ?? undefined,
      big_rig_verdict: s(r.big_rig_verdict),
      tags: s(r.tags),
      notes: s(r.notes),
    }))
    .sort((a, b) => (b.stay_start || "").localeCompare(a.stay_start || ""));

  return { parks, reviews, personal, fetched_at: new Date().toISOString() };
}

export function useSheets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAll,
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
      const { data, error } = await supabase
        .from("reviews_personal")
        .insert({
          park_id: input.park_id,
          park_name: input.park_name,
          stay_start: input.stay_start || null,
          stay_end: input.stay_end || null,
          rating_overall: input.rating_overall,
          big_rig_verdict: input.big_rig_verdict || null,
          tags: input.tags || null,
          notes: input.notes,
        })
        .select("entry_id")
        .single();
      if (error) throw error;
      return { ok: true, entry_id: (data as { entry_id: string }).entry_id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

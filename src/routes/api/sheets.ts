import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import coordsCache from "@/data/coords-cache.json";

const SHEET_ID = "13eLALZ_RDVGXf_QgnblMi-nYhXsbnxCr2ruqNDpACuc";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const HEADER_ROW = 3; // headers live on row 3 in this workbook

type Row = string[];

function authHeaders() {
  const lov = process.env.LOVABLE_API_KEY;
  const gs = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lov) throw new Error("LOVABLE_API_KEY missing");
  if (!gs) throw new Error("GOOGLE_SHEETS_API_KEY missing");
  return {
    Authorization: `Bearer ${lov}`,
    "X-Connection-Api-Key": gs,
  };
}

async function getValues(range: string): Promise<Row[]> {
  const res = await fetch(`${GATEWAY}/spreadsheets/${SHEET_ID}/values/${range}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Sheets ${range} failed [${res.status}]: ${await res.text()}`);
  }
  const data = (await res.json()) as { values?: Row[] };
  return data.values ?? [];
}

function rowsToObjects(rows: Row[]): Record<string, string>[] {
  if (rows.length < HEADER_ROW) return [];
  const headers = rows[HEADER_ROW - 1];
  return rows.slice(HEADER_ROW).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      o[h] = (r[i] ?? "").toString().trim();
    });
    return o;
  });
}

const cache = coordsCache as unknown as Record<string, [number, number]>;

function parsePark(o: Record<string, string>) {
  const lat = parseFloat(o.gps_lat);
  const lon = parseFloat(o.gps_lon);
  const fallback = cache[o.park_id];
  return {
    park_id: o.park_id,
    park_name: o.park_name,
    membership_type: o.membership_type,
    state: o.state,
    city: o.city,
    region: o.region,
    address: o.address,
    lat: Number.isFinite(lat) ? lat : fallback?.[0] ?? null,
    lon: Number.isFinite(lon) ? lon : fallback?.[1] ?? null,
    big_rig_friendly: o.big_rig_friendly,
    cell_quality: o.cell_quality,
    key_amenities: o.key_amenities,
    nearby_highlights: o.nearby_highlights,
    last_updated: o.last_updated,
    notes: o.notes,
  };
}

const personalSchema = z.object({
  park_id: z.string().min(1).max(64),
  park_name: z.string().min(1).max(200),
  stay_start: z.string().max(40).default(""),
  stay_end: z.string().max(40).default(""),
  rating_overall: z.coerce.number().min(0).max(5),
  rating_sites: z.coerce.number().min(0).max(5).optional(),
  rating_amenities: z.coerce.number().min(0).max(5).optional(),
  rating_cell: z.coerce.number().min(0).max(5).optional(),
  big_rig_verdict: z.string().max(20).default(""),
  tags: z.string().max(500).default(""),
  notes: z.string().max(4000).default(""),
});

export const Route = createFileRoute("/api/sheets")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [parkRows, reviewRows, personalRows] = await Promise.all([
            getValues("parks_master!A1:Z2000"),
            getValues("reviews_community!A1:Z5000"),
            getValues("reviews_personal!A1:Z2000"),
          ]);

          const parks = rowsToObjects(parkRows)
            .filter((o) => o.park_id)
            .map(parsePark);
          const reviews = rowsToObjects(reviewRows).filter((o) => o.review_id);
          const personal = rowsToObjects(personalRows).filter(
            (o) => o.entry_id && o.park_id && !o.park_name?.startsWith("(example"),
          );

          return Response.json(
            { parks, reviews, personal, fetched_at: new Date().toISOString() },
            { headers: { "cache-control": "no-store" } },
          );
        } catch (e) {
          console.error("sheets GET failed", e);
          return Response.json(
            { error: e instanceof Error ? e.message : "fetch failed" },
            { status: 502 },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = personalSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 });
          }
          const d = parsed.data;
          const entry_id = `P-${Date.now()}`;
          // Column order from sheet:
          // entry_id, park_id, park_name, stay_start, stay_end, rating_overall,
          // rating_sites, rating_amenities, rating_cell, big_rig_verdict, tags, notes
          const row = [
            entry_id,
            d.park_id,
            d.park_name,
            d.stay_start,
            d.stay_end,
            d.rating_overall,
            d.rating_sites ?? "",
            d.rating_amenities ?? "",
            d.rating_cell ?? "",
            d.big_rig_verdict,
            d.tags,
            d.notes,
          ];

          const res = await fetch(
            `${GATEWAY}/spreadsheets/${SHEET_ID}/values/reviews_personal!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
            {
              method: "POST",
              headers: { ...authHeaders(), "Content-Type": "application/json" },
              body: JSON.stringify({ values: [row] }),
            },
          );
          if (!res.ok) {
            const text = await res.text();
            console.error("append failed", res.status, text);
            return Response.json({ error: `Append failed: ${text}` }, { status: 502 });
          }
          return Response.json({ ok: true, entry_id });
        } catch (e) {
          console.error("sheets POST failed", e);
          return Response.json(
            { error: e instanceof Error ? e.message : "save failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});

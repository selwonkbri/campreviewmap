import { NPS_UNITS } from "./nps-units";

export type NpsUnit = {
  code: string;
  name: string;
  designation: string;
  states: string;
  lat: number;
  lon: number;
  url: string;
};

export type NpsCategory = "park" | "monument" | "recreation" | "historic";

export const NPS_CATEGORIES: { id: NpsCategory; label: string; color: string }[] = [
  { id: "park", label: "National Parks", color: "oklch(0.45 0.09 55)" },
  { id: "monument", label: "Monuments & Preserves", color: "oklch(0.5 0.15 280)" },
  { id: "recreation", label: "Seashores, Lakes & Rivers", color: "oklch(0.55 0.11 225)" },
  { id: "historic", label: "Historic Sites & Memorials", color: "oklch(0.5 0.13 340)" },
];

export function npsCategory(u: NpsUnit): NpsCategory {
  const d = u.designation;
  if (/^National Parks?( & Preserve)?$|National and State Parks/.test(d) || u.code === "npsa")
    return "park";
  if (/Monument|Preserve|Reserve/.test(d) && !/Histor|Part of/.test(d)) return "monument";
  if (/Recreation|Seashore|Lakeshore|River|Scenic Trail|Parkway/.test(d)) return "recreation";
  return "historic";
}

export function npsCategoryMeta(c: NpsCategory) {
  return NPS_CATEGORIES.find((x) => x.id === c)!;
}

export const NPS_SITES = NPS_UNITS.map((u) => ({ ...u, category: npsCategory(u) }));
export type NpsSite = (typeof NPS_SITES)[number];

// Straight-line ("as the crow flies") distance in miles.
export function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

export function nearest<T extends { lat: number | null; lon: number | null }>(
  lat: number,
  lon: number,
  items: T[],
  limit: number,
  maxMiles = Infinity,
) {
  return items
    .filter((i) => i.lat != null && i.lon != null)
    .map((item) => ({
      item,
      miles: milesBetween(lat, lon, item.lat as number, item.lon as number),
    }))
    .filter((x) => x.miles <= maxMiles)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from "react-leaflet";
import { Landmark, ChevronDown } from "lucide-react";
import type { Park, Review } from "@/lib/parks";
import { sentimentScore, scoreToColor } from "@/lib/parks";
import { NPS_CATEGORIES, NPS_SITES, nearest, npsCategoryMeta, type NpsCategory, type NpsSite } from "@/lib/nps";

interface Props {
  parks: Park[];
  reviews: Review[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

// Zoom-aware sizing — dots grow as you zoom in. Smooth scale via CSS var.
function sizeForZoom(z: number) {
  // clamp zoom 3..12 to size 6..22 px
  const zc = Math.max(3, Math.min(12, z));
  return Math.round(6 + ((zc - 3) / 9) * 16);
}

const iconCache = new Map<string, L.DivIcon>();
function getIcon(color: string, size: number, selected: boolean) {
  const key = `${color}|${size}|${selected ? "s" : "n"}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<div class="park-marker${selected ? " is-selected" : ""}" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 35% 35%, ${color}, color-mix(in oklch, ${color} 75%, black))"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

// NPS pins are teardrop-shaped (vs. round campground dots) so the two layers never get confused.
const npsIconCache = new Map<string, L.DivIcon>();
function getNpsIcon(color: string, size: number) {
  const key = `${color}|${size}`;
  let icon = npsIconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<div class="nps-marker" style="width:${size}px;height:${size}px;background:${color}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 1.35],
      popupAnchor: [0, -size * 1.3],
    });
    npsIconCache.set(key, icon);
  }
  return icon;
}

const NPS_STORAGE_KEY = "nps-layers";

function loadNpsLayers(): Set<NpsCategory> {
  try {
    const raw = localStorage.getItem(NPS_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as NpsCategory[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function NpsPopupBody({
  site,
  parks,
  onSelect,
}: {
  site: NpsSite;
  parks: Park[];
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const close = nearest(site.lat, site.lon, parks, 4);
  const meta = npsCategoryMeta(site.category);
  return (
    <div className="min-w-[14rem] font-sans">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
        {site.designation || meta.label} · {site.states.replace(/,/g, ", ")}
      </p>
      <h3 className="mt-0.5 text-sm font-semibold leading-snug">{site.name}</h3>
      <a href={site.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline">
        nps.gov ↗
      </a>
      {close.length > 0 && (
        <div className="mt-2 border-t border-border/60 pt-2">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Nearest campgrounds</p>
          <ul className="space-y-0.5">
            {close.map(({ item, miles }) => (
              <li key={item.park_id}>
                <button
                  className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-0.5 text-left text-xs hover:bg-accent/10"
                  onClick={() => {
                    map.closePopup();
                    onSelect(item.park_id);
                  }}
                >
                  <span className="truncate font-medium">{item.park_name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(miles)} mi</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] text-muted-foreground">Straight-line distance, matching current filters</p>
        </div>
      )}
    </div>
  );
}

function NpsLayerToggle({
  layers,
  onChange,
}: {
  layers: Set<NpsCategory>;
  onChange: (next: Set<NpsCategory>) => void;
}) {
  const [open, setOpen] = useState(false);
  const counts = useMemo(() => {
    const c = {} as Record<NpsCategory, number>;
    for (const s of NPS_SITES) c[s.category] = (c[s.category] ?? 0) + 1;
    return c;
  }, []);
  const toggle = (id: NpsCategory) => {
    const next = new Set(layers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  return (
    <div className="absolute right-3 top-3 z-[1000] w-60 max-w-[calc(100%-4.5rem)] rounded-lg border border-border bg-card/95 text-xs shadow-lg backdrop-blur">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 font-medium"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Landmark className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">National Park Service</span>
        {layers.size > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{layers.size}</span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-1 border-t border-border/60 px-3 py-2">
          {NPS_CATEGORIES.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={layers.has(c.id)}
                onChange={() => toggle(c.id)}
                className="accent-[var(--accent)]"
              />
              <span className="nps-swatch" style={{ background: c.color }} />
              <span className="flex-1">{c.label}</span>
              <span className="tabular-nums text-muted-foreground">{counts[c.id]}</span>
            </label>
          ))}
          <div className="flex gap-3 pt-1 text-muted-foreground">
            <button className="underline" onClick={() => onChange(new Set(NPS_CATEGORIES.map((c) => c.id)))}>
              Show all
            </button>
            <button className="underline" onClick={() => onChange(new Set())}>
              Hide all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  useMapEvent("zoomend", () => onZoom(map.getZoom()));
  return null;
}

function FlyTo({ park }: { park?: Park | null }) {
  const map = useMap();
  useEffect(() => {
    if (park && park.lat && park.lon) {
      map.flyTo([park.lat, park.lon], Math.max(map.getZoom(), 8), { duration: 0.8 });
    }
  }, [park, map]);
  return null;
}

export function IntelligenceMap({ parks, reviews, selectedId, onSelect }: Props) {
  const ref = useRef<L.Map | null>(null);
  const selected = parks.find((p) => p.park_id === selectedId) || null;
  const [zoom, setZoom] = useState(4);
  const size = sizeForZoom(zoom);
  const [npsLayers, setNpsLayers] = useState<Set<NpsCategory>>(loadNpsLayers);
  useEffect(() => {
    try {
      localStorage.setItem(NPS_STORAGE_KEY, JSON.stringify([...npsLayers]));
    } catch {
      /* ignore */
    }
  }, [npsLayers]);
  const npsVisible = useMemo(() => NPS_SITES.filter((s) => npsLayers.has(s.category)), [npsLayers]);
  const npsSize = Math.max(14, Math.min(22, size + 4));

  const items = useMemo(
    () =>
      parks
        .filter((p) => p.lat != null && p.lon != null)
        .map((p) => {
          const s = sentimentScore(p.park_id, reviews);
          return { park: p, ...s, color: scoreToColor(s.score, s.count > 0) };
        }),
    [parks, reviews],
  );

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom
      className="h-full w-full"
      ref={(m) => {
        ref.current = m as unknown as L.Map | null;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2ty0_1_0d8580b92c99eb827efd9cb7"
      />
      <ZoomWatcher onZoom={setZoom} />
      {npsVisible.map((site) => (
        <Marker
          key={site.code}
          position={[site.lat, site.lon]}
          icon={getNpsIcon(npsCategoryMeta(site.category).color, npsSize)}
          zIndexOffset={-500}
          title={site.name}
        >
          <Popup>
            <NpsPopupBody site={site} parks={parks} onSelect={onSelect} />
          </Popup>
        </Marker>
      ))}
      {items.map(({ park, color }) => (
        <Marker
          key={park.park_id}
          position={[park.lat as number, park.lon as number]}
          icon={getIcon(color, park.park_id === selectedId ? size + 6 : size, park.park_id === selectedId)}
          eventHandlers={{ click: () => onSelect(park.park_id) }}
          zIndexOffset={park.park_id === selectedId ? 1000 : 0}
        />
      ))}
      <FlyTo park={selected} />
    </MapContainer>
    <NpsLayerToggle layers={npsLayers} onChange={setNpsLayers} />
    </div>
  );
}


import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvent } from "react-leaflet";
import type { Park, Review } from "@/lib/parks";
import { sentimentScore, scoreToColor } from "@/lib/parks";

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
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomWatcher onZoom={setZoom} />
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
  );
}


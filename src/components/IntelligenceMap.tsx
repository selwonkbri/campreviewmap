import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Park, Review } from "@/lib/parks";
import { sentimentScore } from "@/lib/parks";

interface Props {
  parks: Park[];
  reviews: Review[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

function makeIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<div class="park-marker ${label}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
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

  const items = useMemo(
    () =>
      parks
        .filter((p) => p.lat != null && p.lon != null)
        .map((p) => ({ park: p, ...sentimentScore(p.park_id, reviews) })),
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
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
        {items.map(({ park, label }) => (
          <Marker
            key={park.park_id}
            position={[park.lat as number, park.lon as number]}
            icon={makeIcon(label)}
            eventHandlers={{ click: () => onSelect(park.park_id) }}
          />
        ))}
      </MarkerClusterGroup>
      <FlyTo park={selected} />
    </MapContainer>
  );
}

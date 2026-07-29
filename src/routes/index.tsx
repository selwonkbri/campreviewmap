import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Search, MapIcon, List, Filter, Mountain, RefreshCw, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  useSheets,
  sentimentScore,
  membershipBucket,
  membershipLabel,
  type Park,
} from "@/lib/parks";
import { useDueCount } from "@/lib/watches";
import { DEFAULT_TRIP, type TripSelection } from "@/lib/booking";
import { ParkDetailPanel } from "@/components/ParkDetailPanel";



const IntelligenceMap = lazy(() =>
  import("@/components/IntelligenceMap").then((m) => ({ default: m.IntelligenceMap })),
);

export const Route = createFileRoute("/")({
  component: Index,
  ssr: false,
});

function Index() {
  const { data, isLoading, isFetching, refetch, error } = useSheets();
  const parks = data?.parks ?? [];
  const reviews = data?.reviews ?? [];

  const states = useMemo(
    () => Array.from(new Set(parks.map((p) => p.state).filter(Boolean))).sort(),
    [parks],
  );

  const [query, setQuery] = useState("");
  const [membership, setMembership] = useState<"all" | "thousand-trails-standard" | "thousand-trails-trails-collection">("all");
  const [state, setState] = useState<string>("all");
  const [bigRig, setBigRig] = useState(false);
  const [minSent, setMinSent] = useState<"any" | "mixed" | "positive">("any");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [trip, setTrip] = useState<TripSelection>(() => {
    if (typeof window === "undefined") return DEFAULT_TRIP;
    try {
      const raw = localStorage.getItem("trip-selection");
      return raw ? { ...DEFAULT_TRIP, ...JSON.parse(raw) } : DEFAULT_TRIP;
    } catch {
      return DEFAULT_TRIP;
    }
  });
  useEffect(() => {
    try { localStorage.setItem("trip-selection", JSON.stringify(trip)); } catch { /* ignore */ }
  }, [trip]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parks.filter((p) => {
      if (q && !p.park_name.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
      if (membership !== "all" && membershipBucket(p.membership_type) !== membership) return false;
      if (state !== "all" && p.state !== state) return false;
      if (bigRig && p.big_rig_friendly !== "yes") return false;
      const s = sentimentScore(p.park_id, reviews);
      if (minSent === "positive" && s.label !== "positive") return false;
      if (minSent === "mixed" && s.label === "negative") return false;
      return true;
    });
  }, [parks, reviews, query, membership, state, bigRig, minSent]);

  const selected = parks.find((p) => p.park_id === selectedId) || null;

  const syncedAgo = data?.fetched_at
    ? Math.max(0, Math.round((Date.now() - new Date(data.fetched_at).getTime()) / 60000))
    : null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Toaster theme="light" position="top-center" />
      <header className="z-30 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-ember)] text-accent-foreground shadow-lg">
              <Mountain className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-none">Trailhead</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Campground Intel</p>
            </div>
          </div>

          <div className="relative ml-2 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by park or city…"
              className="h-10 border-border bg-background/60 pl-9"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-xs text-muted-foreground sm:inline-flex"
            onClick={() => refetch()}
            disabled={isFetching}
            title={data?.fetched_at ? `Synced ${new Date(data.fetched_at).toLocaleTimeString()}` : "Sync"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching
              ? "Syncing…"
              : syncedAgo === null
                ? "Sync"
                : syncedAgo === 0
                  ? "Just synced"
                  : `${syncedAgo}m ago`}
          </Button>



          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          <div className="flex overflow-hidden rounded-md border border-border lg:hidden">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1 px-3 py-2 text-xs ${view === "map" ? "bg-accent text-accent-foreground" : "bg-transparent"}`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-3 py-2 text-xs ${view === "list" ? "bg-accent text-accent-foreground" : "bg-transparent"}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-2 gap-2 border-t border-border/60 px-4 py-3 sm:flex sm:flex-wrap sm:items-center lg:px-6">
            <FilterChip label="Membership">
              <select
                className="bg-transparent text-sm outline-none"
                value={membership}
                onChange={(e) => setMembership(e.target.value as never)}
              >
                <option value="all">All</option>
                <option value="thousand-trails-standard">Thousand Trails</option>
                <option value="thousand-trails-trails-collection">Trails Collection</option>
              </select>
            </FilterChip>
            <FilterChip label="State">
              <select
                className="max-w-[6rem] bg-transparent text-sm outline-none"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="all">All</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FilterChip>
            <FilterChip label="Sentiment">
              <select
                className="bg-transparent text-sm outline-none"
                value={minSent}
                onChange={(e) => setMinSent(e.target.value as never)}
              >
                <option value="any">Any</option>
                <option value="mixed">Mixed+</option>
                <option value="positive">Positive only</option>
              </select>
            </FilterChip>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                checked={bigRig}
                onChange={(e) => setBigRig(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Big Rig Friendly
            </label>
            <span className="text-xs text-muted-foreground sm:ml-auto">
              {filtered.length} of {parks.length} parks
            </span>
          </div>
        )}
      </header>

      {error && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive-foreground">
          Couldn't reach Google Sheets. <button className="underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      <main className="relative grid flex-1 overflow-hidden lg:grid-cols-[1fr_28rem]">
        <div className={`${view === "map" ? "block" : "hidden"} lg:block`}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading camps…
            </div>
          ) : (
            <Suspense
              fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}
            >
              <IntelligenceMap parks={filtered} reviews={reviews} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          )}
        </div>
        <aside className={`${view === "list" ? "block" : "hidden"} overflow-y-auto border-l border-border/60 bg-card/40 lg:block`}>
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ParkList parks={filtered} reviews={reviews} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </aside>
      </main>

      <ParkDetailPanel
        park={selected}
        reviews={reviews}
        personal={data?.personal ?? []}
        trip={trip}
        onTripChange={setTrip}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}


function FilterChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      {children}
    </div>
  );
}

function ParkList({
  parks: items,
  reviews,
  selectedId,
  onSelect,
}: {
  parks: Park[];
  reviews: import("@/lib/parks").Review[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">No parks match your filters.</div>;
  }
  return (
    <ul className="divide-y divide-border/40">
      {items.map((p) => {
        const s = sentimentScore(p.park_id, reviews);
        const active = p.park_id === selectedId;
        return (
          <li key={p.park_id}>
            <button
              onClick={() => onSelect(p.park_id)}
              className={`w-full px-5 py-4 text-left transition-colors hover:bg-accent/10 ${active ? "bg-accent/15" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-accent">
                    {membershipLabel(p.membership_type)} · {p.state}
                  </p>
                  <h3 className="truncate text-base font-semibold">{p.park_name}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.city}{p.region ? ` · ${p.region}` : ""}</p>
                </div>
                <span
                  className={`mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                    s.label === "positive"
                      ? "border-sentiment-positive/40 bg-sentiment-positive/10 text-sentiment-positive"
                      : s.label === "negative"
                        ? "border-sentiment-negative/40 bg-sentiment-negative/10 text-sentiment-negative"
                        : s.label === "mixed"
                          ? "border-sentiment-mixed/40 bg-sentiment-mixed/10 text-sentiment-mixed"
                          : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {s.label}
                  {s.count > 0 && <span className="opacity-70">·{s.count}</span>}
                </span>
              </div>
              {p.key_amenities && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.key_amenities}</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

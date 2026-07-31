import { Satellite } from "lucide-react";
import type { Park } from "@/lib/parks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Level = "excellent" | "good" | "poor" | "dead-zone" | "unknown";

function normalize(v: string): Level {
  const t = (v || "").trim().toLowerCase();
  if (t === "excellent" || t === "good" || t === "poor" || t === "dead-zone") return t;
  return "unknown";
}

const LEVEL_META: Record<Level, { bars: number; tone: string; label: string }> = {
  excellent: { bars: 4, tone: "text-sentiment-positive", label: "Excellent" },
  good: { bars: 3, tone: "text-sentiment-positive", label: "Good" },
  poor: { bars: 2, tone: "text-sentiment-mixed", label: "Poor" },
  "dead-zone": { bars: 0, tone: "text-sentiment-negative", label: "Dead zone" },
  unknown: { bars: 0, tone: "text-muted-foreground", label: "No data" },
};

function Bars({ level }: { level: Level }) {
  const meta = LEVEL_META[level];
  if (level === "unknown") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className={`flex items-end gap-0.5 ${meta.tone}`} aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${i <= meta.bars ? "bg-current" : "bg-current/20"}`}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

function CarrierRow({ name, value, primary }: { name: string; value: string; primary?: boolean }) {
  const level = normalize(value);
  const meta = LEVEL_META[level];
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-sm">
        <span className="font-medium">{name}</span>
        {primary && (
          <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            Primary
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <Bars level={level} />
        <span className={`text-xs ${meta.tone}`}>{meta.label}</span>
      </span>
    </div>
  );
}

const EVIDENCE: Record<string, string> = {
  measured: "Speed tested",
  crowdsourced: "Crowd reports",
  qualitative: "Reported bars",
};

const STARLINK: Record<string, { text: string; tone: string }> = {
  works: { text: "Starlink: confirmed working", tone: "text-sentiment-positive" },
  partial: { text: "Starlink: site-dependent", tone: "text-sentiment-mixed" },
  obstructed: { text: "Starlink: heavy tree cover", tone: "text-sentiment-negative" },
};

function formatDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: "short", year: "numeric", day: "numeric" });
}

export function hasConnectivityData(park: Park) {
  return Boolean(
    park.cell_tmobile ||
      park.cell_verizon ||
      park.cell_att ||
      park.cell_detail ||
      (park.starlink_viability && park.starlink_viability !== "unknown"),
  );
}

export function ParkConnectivity({ park }: { park: Park }) {
  if (!hasConnectivityData(park)) return null;

  const evidence = EVIDENCE[(park.cell_evidence_basis || "").toLowerCase()];
  const starlink = STARLINK[(park.starlink_viability || "").toLowerCase()];

  let stale = false;
  if (park.cell_last_verified) {
    const dt = new Date(park.cell_last_verified);
    if (!Number.isNaN(dt.getTime())) {
      stale = Date.now() - dt.getTime() > 1000 * 60 * 60 * 24 * 547;
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Connectivity
        </h3>
        {evidence && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[11px] font-medium">
                  {evidence}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                “Speed tested” means actual speed tests were recorded on site. “Crowd reports” and
                “Reported bars” are self-reported signal quality, so treat them as lower confidence.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
        <div className="divide-y divide-border/50">
          <CarrierRow name="T-Mobile" value={park.cell_tmobile} primary />
          <CarrierRow name="Verizon" value={park.cell_verizon} />
          <CarrierRow name="AT&T" value={park.cell_att} />
        </div>

        {starlink && (
          <p className={`mt-3 flex items-center gap-2 text-sm ${starlink.tone}`}>
            <Satellite className="h-4 w-4" />
            {starlink.text}
          </p>
        )}

        {park.cell_last_verified && (
          <p
            className={`mt-3 text-xs text-muted-foreground ${stale ? "italic opacity-70" : ""}`}
          >
            Carrier data verified {formatDate(park.cell_last_verified)}
          </p>
        )}

        {park.cell_detail && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-3 text-sm leading-relaxed">
            {park.cell_detail.split(/\n{1,}/).filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

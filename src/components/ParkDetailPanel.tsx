import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Wifi, Truck, AlertTriangle, Plus, Calendar, Star } from "lucide-react";
import type { Park, Review, PersonalReview } from "@/lib/parks";
import { sentimentScore, bigRigWarnings, membershipLabel } from "@/lib/parks";
import type { TripSelection } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonalReviewForm } from "./PersonalReviewForm";
import { ParkBookingButtons } from "./ParkBookingButtons";

interface Props {
  park: Park | null;
  reviews: Review[];
  personal: PersonalReview[];
  trip: TripSelection;
  onTripChange: (t: TripSelection) => void;
  onClose: () => void;
}

export function ParkDetailPanel({ park, reviews, personal, trip, onTripChange, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <AnimatePresence>
      {park && (
        <>
          <motion.div
            className="fixed inset-0 z-[1000] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[1001] h-full w-full max-w-xl overflow-y-auto bg-card shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <PanelContent
              park={park}
              reviews={reviews}
              personal={personal}
              trip={trip}
              onTripChange={onTripChange}
              onClose={onClose}
              onAdd={() => setShowForm(true)}
            />
          </motion.aside>
          {showForm && (
            <PersonalReviewForm
              park={park}
              onClose={() => setShowForm(false)}
              onSaved={() => setShowForm(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function PanelContent({
  park,
  reviews,
  personal,
  trip,
  onTripChange,
  onClose,
  onAdd,
}: {
  park: Park;
  reviews: Review[];
  personal: PersonalReview[];
  trip: TripSelection;
  onTripChange: (t: TripSelection) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const sent = sentimentScore(park.park_id, reviews);
  const warnings = bigRigWarnings(park, reviews);
  const community = reviews.filter((r) => r.park_id === park.park_id);
  const mine = personal.filter((r) => r.park_id === park.park_id);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">{membershipLabel(park.membership_type)}</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight">{park.park_name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {park.city}, {park.state}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SentimentBadge label={sent.label} count={sent.count} />
          <Badge variant="outline" className="gap-1">
            <Truck className="h-3 w-3" />
            Big rig: {park.big_rig_friendly}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Wifi className="h-3 w-3" />
            Cell: {park.cell_quality}
          </Badge>
        </div>
      </header>

      <div className="space-y-6 px-6 py-6">
        <section className="rounded-xl border border-border/60 bg-secondary/40 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Intelligence Summary
          </h3>
          <p className="text-sm leading-relaxed">
            {park.notes || `${community.length} community ${community.length === 1 ? "report" : "reports"}, sentiment ${sent.label}. ${park.key_amenities ? "Amenities: " + park.key_amenities + "." : ""}`}
          </p>
          {park.nearby_highlights && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Nearby:</span> {park.nearby_highlights}
            </p>
          )}
        </section>

        {warnings.length > 0 && (
          <section className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Big Rig Warnings
            </h3>
            <ul className="space-y-1 text-sm">
              {warnings.map((w, i) => (
                <li key={i} className="text-foreground/90">• {w}</li>
              ))}
            </ul>
          </section>
        )}

        <ParkBookingButtons park={park} trip={trip} onTripChange={onTripChange} />

        <Button onClick={onAdd} className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
          <Plus className="h-4 w-4" /> Add personal field notes
        </Button>

        {mine.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your field notes
            </h3>
            <div className="space-y-3">
              {mine.map((r) => (
                <div key={r.entry_id} className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {r.stay_start}
                    </span>
                    <span className="flex items-center gap-1 text-accent">
                      <Star className="h-3 w-3 fill-current" /> {r.rating_overall}/5
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {r.big_rig_verdict && <span>Big rig: {r.big_rig_verdict}</span>}
                    {r.tags && <span>{r.tags}</span>}
                  </div>
                  {r.notes && <p className="mt-2 text-sm leading-relaxed">{r.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Community Reviews ({community.length})
          </h3>
          {community.length === 0 ? (
            <p className="text-sm text-muted-foreground">No community reports yet for this park.</p>
          ) : (
            <div className="space-y-3">
              {community.map((r) => (
                <article key={r.review_id} className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="uppercase tracking-wider text-muted-foreground">{r.source_type}</span>
                    <SentimentDot sentiment={r.sentiment} />
                  </div>
                  <p className="text-sm leading-relaxed">{r.summary}</p>
                  {r.raw_quote && (
                    <blockquote className="mt-2 border-l-2 border-accent/60 pl-3 text-xs italic text-muted-foreground">
                      “{r.raw_quote}”
                    </blockquote>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.review_date}</span>
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        Source ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SentimentBadge({ label, count }: { label: string; count: number }) {
  const cls =
    label === "positive"
      ? "bg-sentiment-positive/15 text-sentiment-positive border-sentiment-positive/40"
      : label === "negative"
        ? "bg-sentiment-negative/15 text-sentiment-negative border-sentiment-negative/40"
        : label === "mixed"
          ? "bg-sentiment-mixed/15 text-sentiment-mixed border-sentiment-mixed/40"
          : "bg-sentiment-unknown/15 text-sentiment-unknown border-sentiment-unknown/40";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label} {count > 0 && <span className="opacity-70">· {count}</span>}
    </span>
  );
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color =
    sentiment === "positive"
      ? "bg-sentiment-positive"
      : sentiment === "negative"
        ? "bg-sentiment-negative"
        : sentiment === "mixed"
          ? "bg-sentiment-mixed"
          : "bg-sentiment-unknown";
  return (
    <span className="flex items-center gap-1 text-xs capitalize text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {sentiment || "unknown"}
    </span>
  );
}

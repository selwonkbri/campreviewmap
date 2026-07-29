import { createFileRoute, Link } from "@tanstack/react-router";
import { Mountain, MapIcon, ExternalLink, CalendarClock, Check, X, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  countdownLabel,
  formatWatchDate,
  useSetWatchStatus,
  useWatches,
  type BookingWatchDue,
} from "@/lib/watches";

export const Route = createFileRoute("/watches")({
  component: WatchesPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Booking Watches — Trailhead Campground Intel" },
      {
        name: "description",
        content:
          "Track when each campground's reservation window opens, with a book-now list of stays you can lock in today.",
      },
      { property: "og:title", content: "Booking Watches — Trailhead Campground Intel" },
      {
        property: "og:description",
        content:
          "Track when each campground's reservation window opens, with a book-now list of stays you can lock in today.",
      },
    ],
  }),
});

function WatchesPage() {
  const { data, isLoading, error } = useWatches();
  const watches = data ?? [];

  const bookNow = watches
    .filter((w) => w.status === "notified" || w.days_until_book_on <= 0)
    .sort((a, b) => a.book_on.localeCompare(b.book_on));
  const upcoming = watches
    .filter((w) => w.status === "active" && w.days_until_book_on > 0)
    .sort((a, b) => a.book_on.localeCompare(b.book_on));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="light" position="top-center" />
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-ember)] text-accent-foreground shadow-lg">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Watches</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Booking windows
            </p>
          </div>
          <Link to="/" className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5">
              <MapIcon className="h-4 w-4" /> Map
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading watches…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Couldn't load your watches. Try refreshing.</p>
        ) : watches.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-secondary/40 p-8 text-center">
            <BellRing className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No watches yet. Open a campground and use Notify me to track when its booking window
              opens.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {bookNow.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                  <CalendarClock className="h-4 w-4" /> Book now ({bookNow.length})
                </h2>
                <div className="space-y-3">
                  {bookNow.map((w) => (
                    <WatchRow key={w.id} watch={w} highlighted />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((w) => (
                    <WatchRow key={w.id} watch={w} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function WatchRow({ watch, highlighted }: { watch: BookingWatchDue; highlighted?: boolean }) {
  const setStatus = useSetWatchStatus();

  async function update(status: "booked" | "dismissed") {
    try {
      await setStatus.mutateAsync({ id: watch.id, status });
      toast.success(status === "booked" ? "Marked as booked" : "Watch dismissed");
    } catch {
      toast.error("Couldn't update that watch. Try again.");
    }
  }

  return (
    <article
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-accent/50 bg-accent/10 shadow-sm ring-1 ring-accent/20"
          : "border-border/60 bg-card/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {watch.booking_url ? (
            <a
              href={watch.booking_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-base font-semibold text-primary hover:underline"
            >
              {watch.park_name}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <h3 className="truncate text-base font-semibold">{watch.park_name}</h3>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[watch.city, watch.state].filter(Boolean).join(", ")}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {watch.lead_days} day
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
        <p className="text-muted-foreground">
          Arrive <span className="font-medium text-foreground">{formatWatchDate(watch.desired_start_date)}</span>
        </p>
        <p className="text-muted-foreground">
          Book on <span className="font-medium text-foreground">{formatWatchDate(watch.book_on)}</span>
        </p>
      </div>

      <p className={`mt-2 text-sm font-semibold ${highlighted ? "text-accent" : "text-muted-foreground"}`}>
        {countdownLabel(watch.days_until_book_on)}
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => update("booked")}
          disabled={setStatus.isPending}
        >
          <Check className="h-3.5 w-3.5" /> Booked
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => update("dismissed")}
          disabled={setStatus.isPending}
        >
          <X className="h-3.5 w-3.5" /> Dismiss
        </Button>
      </div>
    </article>
  );
}

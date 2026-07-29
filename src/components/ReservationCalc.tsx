import { useState, useMemo } from "react";
import { CalendarClock, PhoneCall, Bell, BellRing, X } from "lucide-react";
import { toast } from "sonner";
import type { Park } from "@/lib/parks";
import {
  DuplicateWatchError,
  useAddWatch,
  useSetWatchStatus,
  useWatches,
} from "@/lib/watches";
import { Button } from "@/components/ui/button";

function windowDays(membership: string): number | null {
  if (membership === "thousand-trails-standard") return 120;
  if (membership === "thousand-trails-trails-collection") return 60;
  return null;
}

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function ReservationCalc({ park }: { park: Park }) {
  const days = windowDays(park.membership_type);
  const [stay, setStay] = useState("");

  const { data: watches } = useWatches();
  const addWatch = useAddWatch();
  const setStatus = useSetWatchStatus();

  const existingWatch = useMemo(
    () =>
      (watches ?? []).find(
        (w) =>
          w.park_id === park.park_id &&
          w.desired_start_date === stay &&
          (w.status === "active" || w.status === "notified"),
      ) ?? null,
    [watches, park.park_id, stay],
  );

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const furthest = days != null ? addDays(today, days) : null;

  const callDate = useMemo(() => {
    if (!stay || days == null) return null;
    const [y, m, d] = stay.split("-").map(Number);
    if (!y || !m || !d) return null;
    const stayDate = new Date(y, m - 1, d);
    stayDate.setHours(0, 0, 0, 0);
    const call = addDays(stayDate, -days);
    const overdue = call < today;
    return { stayDate, call, overdue };
  }, [stay, days, today]);

  async function handleNotify() {
    try {
      await addWatch.mutateAsync({ park_id: park.park_id, desired_start_date: stay });
      toast.success("Watching this date — we'll flag it when the window opens.");
    } catch (err) {
      if (err instanceof DuplicateWatchError) {
        toast.error("Already watching this date");
      } else {
        toast.error("Couldn't save that watch. Try again.");
      }
    }
  }

  async function handleRemove() {
    if (!existingWatch) return;
    try {
      await setStatus.mutateAsync({ id: existingWatch.id, status: "dismissed" });
      toast.success("Watch removed");
    } catch {
      toast.error("Couldn't remove that watch. Try again.");
    }
  }

  if (days == null) {
    return (
      <section className="rounded-xl border border-border/60 bg-secondary/40 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarClock className="h-4 w-4" /> Reservation Calc
        </h3>
        <p className="text-sm text-muted-foreground">
          Booking window unknown for this membership type. Check the park's official site.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/60 bg-secondary/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarClock className="h-4 w-4" /> Reservation Calc
      </h3>

      <div className="mb-4 rounded-lg border border-border/50 bg-background/40 p-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Furthest date bookable today
        </p>
        <p className="mt-1 text-base font-semibold">{fmt(furthest!)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Booking window: {days} days in advance
        </p>
      </div>

      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Desired stay start
      </label>
      <input
        type="date"
        value={stay}
        onChange={(e) => setStay(e.target.value)}
        className="mt-1 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
      />

      {callDate && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">
            <PhoneCall className="h-3 w-3" /> Book on
          </p>
          <p className="mt-1 text-base font-semibold">{fmt(callDate.call)}</p>
          {callDate.overdue && (
            <p className="mt-1 text-xs text-sentiment-mixed">
              That date has already passed — you can book this stay now.
            </p>
          )}
        </div>
      )}

      {existingWatch ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
          <BellRing className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-sm font-medium text-primary">Watching this date</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={handleRemove}
            disabled={setStatus.isPending}
          >
            <X className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ) : (
        <Button
          className="mt-3 w-full gap-2"
          variant="outline"
          disabled={!stay || addWatch.isPending}
          onClick={handleNotify}
        >
          <Bell className="h-4 w-4" />
          {addWatch.isPending ? "Saving…" : "Notify me"}
        </Button>
      )}
    </section>
  );
}

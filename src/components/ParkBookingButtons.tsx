import { useState } from "react";
import { ExternalLink, CalendarCheck, Users, Minus, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { Park } from "@/lib/parks";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { buildBookingUrl, type TripSelection } from "@/lib/booking";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseYmd(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function ParkBookingButtons({
  park,
  trip,
  onTripChange,
}: {
  park: Park;
  trip: TripSelection;
  onTripChange: (t: TripSelection) => void;
}) {
  const hasBooking = Boolean(park.booking_url);
  const hasOfficial = Boolean(park.official_url);
  const [open, setOpen] = useState(false);

  if (!hasBooking && !hasOfficial) {
    return <p className="text-xs text-muted-foreground">No official link available.</p>;
  }

  const datesReady = Boolean(trip.from && trip.to);
  const bookHref =
    hasBooking && datesReady
      ? buildBookingUrl(park.booking_url, {
          from: trip.from,
          to: trip.to,
          adults: trip.adults,
          children: trip.children,
          animals: trip.animals,
        })
      : null;

  const range: DateRange | undefined =
    trip.from || trip.to
      ? { from: parseYmd(trip.from), to: parseYmd(trip.to) }
      : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const set = <K extends keyof TripSelection>(k: K, v: TripSelection[K]) =>
    onTripChange({ ...trip, [k]: v });

  const handleRange = (r: DateRange | undefined) => {
    onTripChange({
      ...trip,
      from: r?.from ? ymd(r.from) : "",
      to: r?.to ? ymd(r.to) : "",
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {hasBooking && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="h-4 w-4" />
              {datesReady ? `Book ${trip.from.slice(5)} → ${trip.to.slice(5)}` : "Book this park"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={8}
            className="w-auto space-y-3 p-4 z-[1100]"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {!range?.from
                  ? "Step 1: pick your arrival date"
                  : !range?.to
                    ? "Step 2: pick your departure date"
                    : "Trip dates selected"}
              </p>
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleRange}
                numberOfMonths={1}
                disabled={{ before: today }}
                defaultMonth={range?.from ?? today}
                className="pointer-events-auto"
              />
              {(trip.from || trip.to) && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => onTripChange({ ...trip, from: "", to: "" })}
                >
                  Clear dates
                </button>
              )}
            </div>
            <div className="space-y-2 pt-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Party
              </p>
              <Stepper label="Adults" value={trip.adults} min={1} onChange={(v) => set("adults", v)} />
              <Stepper label="Children" value={trip.children} min={0} onChange={(v) => set("children", v)} />
              <Stepper label="Pets" value={trip.animals} min={0} onChange={(v) => set("animals", v)} />
            </div>
            <Button
              asChild={Boolean(bookHref)}
              size="lg"
              disabled={!bookHref}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => bookHref && setOpen(false)}
            >
              {bookHref ? (
                <a href={bookHref} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck className="h-4 w-4" /> Continue to booking
                </a>
              ) : (
                <span>
                  <CalendarCheck className="h-4 w-4" /> Select dates to continue
                </span>
              )}
            </Button>
          </PopoverContent>
        </Popover>
      )}
      {hasOfficial && (
        <Button asChild variant="outline" size="lg" className="flex-1 gap-2">
          <a href={park.official_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> View park page
          </a>
        </Button>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-5 text-center text-sm tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

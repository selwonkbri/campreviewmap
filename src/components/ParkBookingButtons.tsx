import { ExternalLink, CalendarCheck } from "lucide-react";
import type { Park } from "@/lib/parks";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildBookingUrl, type TripSelection } from "@/lib/booking";

export function ParkBookingButtons({ park, trip }: { park: Park; trip: TripSelection }) {
  const hasBooking = Boolean(park.booking_url);
  const hasOfficial = Boolean(park.official_url);
  const datesReady = Boolean(trip.from && trip.to);

  if (!hasBooking && !hasOfficial) {
    return (
      <p className="text-xs text-muted-foreground">No official link available.</p>
    );
  }

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

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {hasBooking && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex-1">
                {bookHref ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <a href={bookHref} target="_blank" rel="noopener noreferrer">
                      <CalendarCheck className="h-4 w-4" /> Book this park
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" disabled className="w-full gap-2">
                    <CalendarCheck className="h-4 w-4" /> Book this park
                  </Button>
                )}
              </span>
            </TooltipTrigger>
            {!datesReady && (
              <TooltipContent>Select dates to book</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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

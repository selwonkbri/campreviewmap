export type TripSelection = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  adults: number;
  children: number;
  animals: number;
};

export const DEFAULT_TRIP: TripSelection = {
  from: "",
  to: "",
  adults: 2,
  children: 0,
  animals: 0,
};

export function buildBookingUrl(
  bookingUrl: string,
  opts: { from: string; to: string; adults?: number; children?: number; animals?: number },
): string {
  const params = new URLSearchParams({
    available_from: opts.from,
    available_to: opts.to,
    adults: String(opts.adults ?? 2),
    children: String(opts.children ?? 0),
    animals: String(opts.animals ?? 0),
  });
  // booking_url already ends in "/", append "?" directly.
  return `${bookingUrl}?${params.toString()}`;
}

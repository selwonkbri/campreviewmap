import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { bookingWindowDays, fail, json, membershipLabel, publicSupabase } from "../supabase";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default defineTool({
  name: "reservation_window",
  title: "Reservation booking window",
  description:
    "For a campground, returns the booking window (120 days for Thousand Trails standard, 60 for Trails Collection), the furthest date bookable today, and — if a desired arrival date is given — the exact date to call and reserve.",
  inputSchema: {
    park_id: z.string().describe("Campground park_id."),
    stay_start: z
      .string()
      .optional()
      .describe("Desired arrival date as YYYY-MM-DD; returns the date to book."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ park_id, stay_start }) => {
    const supabase = publicSupabase();
    const { data, error } = await supabase
      .from("parks_master")
      .select("park_id,park_name,membership_type,booking_url,official_url")
      .eq("park_id", park_id)
      .limit(1);
    if (error) return fail(error.message);
    const park = (data ?? [])[0];
    if (!park) return fail("No matching campground found.");

    const days = bookingWindowDays((park.membership_type as string) ?? "");
    const today = new Date();
    const furthest = new Date(today);
    furthest.setUTCDate(furthest.getUTCDate() + days);

    let bookOn: string | null = null;
    let bookable_today = false;
    if (stay_start) {
      const start = new Date(`${stay_start}T00:00:00Z`);
      if (Number.isNaN(start.getTime())) return fail("stay_start must be YYYY-MM-DD.");
      const call = new Date(start);
      call.setUTCDate(call.getUTCDate() - days);
      bookOn = iso(call);
      bookable_today = call <= today;
    }

    return json({
      park_id: park.park_id,
      park_name: park.park_name,
      membership: membershipLabel((park.membership_type as string) ?? ""),
      booking_window_days: days,
      furthest_bookable_date: iso(furthest),
      desired_stay_start: stay_start ?? null,
      book_on_date: bookOn,
      bookable_today,
      booking_url: park.booking_url ?? null,
    });
  },
});

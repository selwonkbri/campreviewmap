import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseExternal as supabase } from "@/integrations/supabase/external";

export type WatchStatus = "active" | "notified" | "booked" | "dismissed";

export type BookingWatchDue = {
  id: string;
  park_id: string;
  park_name: string | null;
  city: string | null;
  state: string | null;
  membership_type: string | null;
  booking_url: string | null;
  desired_start_date: string;
  lead_days: number;
  book_on: string;
  days_until_book_on: number;
  status: WatchStatus;
  notified_at: string | null;
  created_at: string;
};

export const WATCHES_KEY = ["booking-watches-due"] as const;

/** All open watches (active + notified) from the read-only view. */
export function useWatches() {
  return useQuery({
    queryKey: WATCHES_KEY,
    queryFn: async (): Promise<BookingWatchDue[]> => {
      const { data, error } = await supabase
        .from("booking_watches_due")
        .select("*")
        .in("status", ["active", "notified"])
        .order("book_on", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BookingWatchDue[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Count of watches that are actionable today — drives the nav badge. */
export function useDueCount() {
  const { data } = useWatches();
  return (data ?? []).filter((w) => w.status === "notified" || w.days_until_book_on <= 0).length;
}

export class DuplicateWatchError extends Error {
  constructor() {
    super("Already watching this date");
    this.name = "DuplicateWatchError";
  }
}

export function useAddWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { park_id: string; desired_start_date: string }) => {
      const { data, error } = await supabase
        .from("booking_watches")
        .insert({
          park_id: input.park_id,
          desired_start_date: input.desired_start_date,
          status: "active",
        })
        .select("id")
        .single();
      if (error) {
        if ((error as { code?: string }).code === "23505") throw new DuplicateWatchError();
        throw error;
      }
      return data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WATCHES_KEY }),
  });
}

export function useSetWatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: WatchStatus }) => {
      const { error } = await supabase
        .from("booking_watches")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WATCHES_KEY }),
  });
}

/** Fri, Aug 28, 2026 */
export function formatWatchDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function countdownLabel(days: number): string {
  if (days === 0) return "today";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

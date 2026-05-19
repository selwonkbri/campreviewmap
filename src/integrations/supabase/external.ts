// External Supabase project (user-owned, separate from Lovable Cloud).
// Schema: parks_master, reviews_community, reviews_personal, tags_library.
// RLS is disabled on these tables, so the publishable key handles reads/writes.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cibujcpcqfusgizdmqkr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jNCopv5ATsO5VGLjcJZ3xQ_Dad75Oh_";

export const supabaseExternal = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: false,
    autoRefreshToken: false,
    storageKey: "sb-external-auth",
  },
});

import { createClient } from "@supabase/supabase-js";

// No login in the demo: everyone uses the public key, limited by the rules in supabase/migrations.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

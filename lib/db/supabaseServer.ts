import { createClient } from "@supabase/supabase-js";
import { assertEnvForSupabase, hasSupabaseConfig } from "@/lib/config/env";

export const getSupabaseServerClient = () => {
  if (!hasSupabaseConfig) {
    return null;
  }

  const { supabaseUrl, supabaseServerKey } = assertEnvForSupabase();
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

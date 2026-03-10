"use client";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/config/public-env";

let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  }
  return browserClient;
};

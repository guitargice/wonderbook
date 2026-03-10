"use client";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return browserClient;
};

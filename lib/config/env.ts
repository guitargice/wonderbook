const requiredInProduction = (value: string | undefined, key: string): string => {
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mockStoryMode: (process.env.MOCK_STORY_MODE ?? "false").toLowerCase() === "true",
  mockAnimationMode: (process.env.MOCK_ANIMATION_MODE ?? "true").toLowerCase() === "true",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmBaseUrl: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  grokImagineApiKey: process.env.GROK_IMAGINE_API_KEY ?? "",
  xaiApiKey: process.env.XAI_API_KEY ?? "",
  grokImagineBaseUrl: process.env.GROK_IMAGINE_BASE_URL ?? "https://api.x.ai",
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase() === "true",
};

const resolvedSupabaseServerKey =
  env.supabaseServiceRoleKey || env.supabaseSecretKey || process.env.SUPABASE_ANON_KEY || env.supabaseAnonKey;

export const hasSupabaseConfig =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey) && Boolean(resolvedSupabaseServerKey);

export const assertEnvForSupabase = () => ({
  supabaseUrl: requiredInProduction(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServerKey: requiredInProduction(
    resolvedSupabaseServerKey,
    "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY",
  ),
});

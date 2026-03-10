import "server-only";

const requiredInProduction = (value: string | undefined, key: string): string => {
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
};

export const getServerEnv = () => {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const llmApiKey = process.env.LLM_API_KEY;
  const llmBaseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  const llmModel = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const fallbackSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const grokImagineApiKey = process.env.GROK_IMAGINE_API_KEY;
  const xaiApiKey = process.env.XAI_API_KEY;
  const grokImagineBaseUrl = process.env.GROK_IMAGINE_BASE_URL ?? "https://api.x.ai";

  const mockStoryMode = (process.env.MOCK_STORY_MODE ?? "false").toLowerCase() === "true";
  const mockAnimationMode = (process.env.MOCK_ANIMATION_MODE ?? "true").toLowerCase() === "true";

  const resolvedSupabaseServerKey =
    supabaseServiceRoleKey || supabaseSecretKey || fallbackSupabaseAnonKey || supabaseAnonKey;

  return {
    nodeEnv,
    mockStoryMode,
    mockAnimationMode,
    llmApiKey: requiredInProduction(llmApiKey, "LLM_API_KEY"),
    llmBaseUrl,
    llmModel,
    supabaseUrl: requiredInProduction(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requiredInProduction(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServerKey: requiredInProduction(
      resolvedSupabaseServerKey,
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY",
    ),
    grokImagineApiKey: grokImagineApiKey ?? "",
    xaiApiKey: xaiApiKey ?? "",
    grokImagineBaseUrl,
  };
};

export const hasSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resolvedSupabaseServerKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(supabaseUrl) && Boolean(supabaseAnonKey) && Boolean(resolvedSupabaseServerKey);
};

export const assertEnvForSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolvedSupabaseServerKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    supabaseUrl: requiredInProduction(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServerKey: requiredInProduction(
      resolvedSupabaseServerKey,
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY",
    ),
  };
};

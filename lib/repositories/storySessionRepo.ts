import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { hasSupabaseConfig } from "@/lib/config/env";
import { getAggregateFromMemory, memoryDb } from "@/lib/repositories/memoryStore";
import type { SessionAggregate, StorySession } from "@/lib/types/domain";

const TABLE = "story_sessions";

export const storySessionRepo = {
  async insert(session: StorySession): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from(TABLE).insert({
        id: session.id,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        title: session.title,
        theme: session.theme,
        tone: session.tone,
        target_age: session.targetAge,
        child_count: session.childCount,
        children_config: session.childrenConfig,
        story_length: session.storyLength,
        story_outline: session.storyOutline,
        current_page_number: session.currentPageNumber,
        status: session.status,
      });
      if (error) throw error;
      return;
    }
    memoryDb.sessions.push(session);
  },

  async update(sessionId: string, patch: Partial<StorySession>): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig && supabase) {
      const payload: Record<string, unknown> = {};
      if (patch.updatedAt) payload.updated_at = patch.updatedAt;
      if (patch.currentPageNumber !== undefined) payload.current_page_number = patch.currentPageNumber;
      if (patch.status) payload.status = patch.status;
      if (patch.title) payload.title = patch.title;

      const { error } = await supabase.from(TABLE).update(payload).eq("id", sessionId);
      if (error) throw error;
      return;
    }

    const index = memoryDb.sessions.findIndex((item) => item.id === sessionId);
    if (index >= 0) {
      memoryDb.sessions[index] = { ...memoryDb.sessions[index], ...patch };
    }
  },

  async getAggregate(sessionId: string): Promise<SessionAggregate | null> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig && supabase) {
      const sessionResult = await supabase.from(TABLE).select("*").eq("id", sessionId).single();
      if (sessionResult.error || !sessionResult.data) {
        return null;
      }

      const pagesResult = await supabase
        .from("story_pages")
        .select("*")
        .eq("story_session_id", sessionId)
        .order("page_number", { ascending: true });

      const jobsResult = await supabase.from("animation_jobs").select("*");
      const session = mapSessionRecord(sessionResult.data);
      const pages = (pagesResult.data ?? []).map(mapPageRecord);
      const jobs = (jobsResult.data ?? [])
        .map(mapJobRecord)
        .filter((job) => pages.some((page) => page.id === job.pageId));

      return { session, pages, jobs };
    }

    return getAggregateFromMemory(sessionId);
  },
};

const mapSessionRecord = (record: Record<string, unknown>): StorySession => ({
  id: String(record.id),
  createdAt: String(record.created_at),
  updatedAt: String(record.updated_at),
  title: String(record.title),
  theme: String(record.theme),
  tone: String(record.tone),
  targetAge: String(record.target_age),
  childCount: Number(record.child_count),
  childrenConfig: (record.children_config as StorySession["childrenConfig"]) ?? [],
  storyLength: String(record.story_length) as StorySession["storyLength"],
  storyOutline: record.story_outline as StorySession["storyOutline"],
  currentPageNumber: Number(record.current_page_number),
  status: String(record.status) as StorySession["status"],
});

const mapPageRecord = (record: Record<string, unknown>) => ({
  id: String(record.id),
  storySessionId: String(record.story_session_id),
  pageNumber: Number(record.page_number),
  storyText: String(record.story_text),
  drawingPrompt: String(record.drawing_prompt),
  drawingImageUrl: (record.drawing_image_url as string | null) ?? null,
  drawingSummary: (record.drawing_summary as string | null) ?? null,
  generatedAnimationUrl: (record.generated_animation_url as string | null) ?? null,
  generationStatus: String(record.generation_status) as "idle" | "pending" | "complete" | "failed",
  generationMetadata: (record.generation_metadata as Record<string, unknown> | null) ?? null,
});

const mapJobRecord = (record: Record<string, unknown>) => ({
  id: String(record.id),
  pageId: String(record.page_id),
  provider: String(record.provider),
  status: String(record.status) as "pending" | "processing" | "completed" | "failed",
  requestPayload: (record.request_payload as Record<string, unknown> | null) ?? null,
  responsePayload: (record.response_payload as Record<string, unknown> | null) ?? null,
  errorMessage: (record.error_message as string | null) ?? null,
  createdAt: String(record.created_at),
  updatedAt: String(record.updated_at),
  simulateReadyAt: (record.simulate_ready_at as string | null) ?? null,
});

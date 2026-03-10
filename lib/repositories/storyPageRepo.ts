import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { hasSupabaseConfig } from "@/lib/config/server-env";
import { memoryDb } from "@/lib/repositories/memoryStore";
import type { StoryPage } from "@/lib/types/domain";

const TABLE = "story_pages";

export const storyPageRepo = {
  async insert(page: StoryPage): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const { error } = await supabase.from(TABLE).insert({
        id: page.id,
        story_session_id: page.storySessionId,
        page_number: page.pageNumber,
        story_text: page.storyText,
        drawing_prompt: page.drawingPrompt,
        drawing_image_url: page.drawingImageUrl,
        drawing_summary: page.drawingSummary,
        generated_animation_url: page.generatedAnimationUrl,
        generation_status: page.generationStatus,
        generation_metadata: page.generationMetadata,
      });
      if (error) throw error;
      return;
    }
    memoryDb.pages.push(page);
  },

  async update(pageId: string, patch: Partial<StoryPage>): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const payload: Record<string, unknown> = {};
      if (patch.drawingImageUrl !== undefined) payload.drawing_image_url = patch.drawingImageUrl;
      if (patch.generatedAnimationUrl !== undefined) {
        payload.generated_animation_url = patch.generatedAnimationUrl;
      }
      if (patch.generationStatus) payload.generation_status = patch.generationStatus;
      if (patch.generationMetadata !== undefined) payload.generation_metadata = patch.generationMetadata;
      if (patch.drawingSummary !== undefined) payload.drawing_summary = patch.drawingSummary;
      if (patch.storyText !== undefined) payload.story_text = patch.storyText;
      if (patch.drawingPrompt !== undefined) payload.drawing_prompt = patch.drawingPrompt;
      const { error } = await supabase.from(TABLE).update(payload).eq("id", pageId);
      if (error) throw error;
      return;
    }

    const index = memoryDb.pages.findIndex((item) => item.id === pageId);
    if (index >= 0) {
      memoryDb.pages[index] = { ...memoryDb.pages[index], ...patch };
    }
  },

  async getById(pageId: string): Promise<StoryPage | null> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", pageId).single();
      if (error || !data) return null;
      return {
        id: String(data.id),
        storySessionId: String(data.story_session_id),
        pageNumber: Number(data.page_number),
        storyText: String(data.story_text),
        drawingPrompt: String(data.drawing_prompt),
        drawingImageUrl: data.drawing_image_url,
        drawingSummary: data.drawing_summary,
        generatedAnimationUrl: data.generated_animation_url,
        generationStatus: data.generation_status,
        generationMetadata: data.generation_metadata,
      };
    }

    return memoryDb.pages.find((item) => item.id === pageId) ?? null;
  },
};

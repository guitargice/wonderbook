import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { hasSupabaseConfig } from "@/lib/config/server-env";
import { memoryDb } from "@/lib/repositories/memoryStore";
import type { AnimationJob } from "@/lib/types/domain";

const TABLE = "animation_jobs";

export const animationJobRepo = {
  async insert(job: AnimationJob): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const { error } = await supabase.from(TABLE).insert({
        id: job.id,
        page_id: job.pageId,
        provider: job.provider,
        status: job.status,
        request_payload: job.requestPayload,
        response_payload: job.responsePayload,
        error_message: job.errorMessage,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
        simulate_ready_at: job.simulateReadyAt,
      });
      if (error) throw error;
      return;
    }
    memoryDb.jobs.push(job);
  },

  async update(jobId: string, patch: Partial<AnimationJob>): Promise<void> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const payload: Record<string, unknown> = {};
      if (patch.status) payload.status = patch.status;
      if (patch.requestPayload !== undefined) payload.request_payload = patch.requestPayload;
      if (patch.responsePayload !== undefined) payload.response_payload = patch.responsePayload;
      if (patch.errorMessage !== undefined) payload.error_message = patch.errorMessage;
      if (patch.updatedAt !== undefined) payload.updated_at = patch.updatedAt;
      if (patch.simulateReadyAt !== undefined) payload.simulate_ready_at = patch.simulateReadyAt;
      const { error } = await supabase.from(TABLE).update(payload).eq("id", jobId);
      if (error) throw error;
      return;
    }

    const index = memoryDb.jobs.findIndex((item) => item.id === jobId);
    if (index >= 0) {
      memoryDb.jobs[index] = { ...memoryDb.jobs[index], ...patch };
    }
  },

  async getById(jobId: string): Promise<AnimationJob | null> {
    const supabase = getSupabaseServerClient();
    if (hasSupabaseConfig() && supabase) {
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", jobId).single();
      if (error || !data) return null;
      return {
        id: String(data.id),
        pageId: String(data.page_id),
        provider: String(data.provider),
        status: data.status,
        requestPayload: data.request_payload,
        responsePayload: data.response_payload,
        errorMessage: data.error_message,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        simulateReadyAt: data.simulate_ready_at,
      };
    }
    return memoryDb.jobs.find((item) => item.id === jobId) ?? null;
  },
};

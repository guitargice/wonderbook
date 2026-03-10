import { getServerEnv } from "@/lib/config/server-env";
import { buildAnimationPrompt } from "@/lib/services/story/prompts/animationPrompt";
import { GrokImagineProvider } from "@/lib/services/animation/providers/GrokImagineProvider";
import { MockAnimationProvider } from "@/lib/services/animation/providers/MockAnimationProvider";
import type { AnimationProvider } from "@/lib/services/animation/providers/AnimationProvider";
import type { StoryPage, StorySession } from "@/lib/types/domain";

const getProvider = (): AnimationProvider => {
  const env = getServerEnv();
  if (env.mockAnimationMode || !(env.grokImagineApiKey || env.xaiApiKey)) {
    return new MockAnimationProvider();
  }
  return new GrokImagineProvider();
};

export const animationService = {
  getProviderName() {
    return getProvider().name;
  },

  async createJob(input: { session: StorySession; currentPage: StoryPage; drawingImageUrl: string }) {
    const provider = getProvider();
    const prompt = buildAnimationPrompt({
      session: input.session,
      currentPage: input.currentPage,
    });
    return provider.createJob({
      prompt,
      drawingImageUrl: input.drawingImageUrl,
      sessionId: input.session.id,
      pageId: input.currentPage.id,
    });
  },

  async getStatus(externalJobId: string) {
    const provider = getProvider();
    return provider.getJobStatus(externalJobId);
  },
};

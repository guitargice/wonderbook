import { getServerEnv } from "@/lib/config/server-env";
import { LlmStoryProvider } from "@/lib/services/story/providers/LlmStoryProvider";
import { MockStoryProvider } from "@/lib/services/story/providers/MockStoryProvider";
import type {
  SetupInput,
  StoryOutline,
  StoryPage,
  StorySession,
  StoryLength,
} from "@/lib/types/domain";
import type { StoryProvider } from "@/lib/services/story/providers/StoryProvider";

const pageCountFromLength = (length: StoryLength): number => {
  if (length === "short") return 4;
  if (length === "medium") return 7;
  return 10;
};

const providerFromEnv = (): StoryProvider => {
  const env = getServerEnv();
  if (env.mockStoryMode || !env.llmApiKey) {
    return new MockStoryProvider();
  }
  return new LlmStoryProvider();
};

const sanitizeStoryText = (value: string): string => {
  return value
    .replace(/kill|blood|weapon|hate/gi, "kindness")
    .trim();
};

export const storyService = {
  async generateInitial(input: SetupInput): Promise<{
    sessionTitle: string;
    openingIntro: string;
    firstPageText: string;
    firstDrawingPrompt: string;
    outline: StoryOutline;
  }> {
    const provider = providerFromEnv();
    let generated: {
      outline: StoryOutline;
      openingIntro: string;
      firstPageText: string;
      firstDrawingPrompt: string;
    };
    try {
      generated = await provider.generateInitial(input);
    } catch {
      // If the external LLM provider returns malformed payloads, fall back to deterministic mock.
      generated = await new MockStoryProvider().generateInitial(input);
    }

    const safeTitle = generated.outline?.title?.trim() || "A Magical Family Adventure";
    const safeOpening = generated.openingIntro?.trim() || "A new story opens with a spark of imagination.";
    const safeFirstPage =
      generated.firstPageText?.trim() || "Our heroes begin their journey together with courage and kindness.";
    const safeDrawingPrompt =
      generated.firstDrawingPrompt?.trim() || "Draw the hero and one helpful object for the adventure.";

    return {
      sessionTitle: safeTitle,
      openingIntro: sanitizeStoryText(safeOpening),
      firstPageText: sanitizeStoryText(safeFirstPage),
      firstDrawingPrompt: safeDrawingPrompt,
      outline: {
        ...generated.outline,
        title: safeTitle,
        totalPages: generated.outline.totalPages || pageCountFromLength(input.storyLength),
      },
    };
  },

  async generateNext(input: {
    setup: SetupInput;
    outline: StoryOutline;
    priorPages: StoryPage[];
    latestDrawingSummary?: string;
    nextPageNumber: number;
  }) {
    const provider = providerFromEnv();
    let generated: { storyText: string; drawingPrompt: string; isEndingPage: boolean };
    try {
      generated = await provider.generateNext(input);
    } catch {
      generated = await new MockStoryProvider().generateNext(input);
    }

    return {
      storyText: sanitizeStoryText(generated.storyText || "The story continues with a hopeful new scene."),
      drawingPrompt:
        generated.drawingPrompt?.trim() || "Draw the next moment that helps the heroes move forward.",
      isEndingPage: generated.isEndingPage,
    };
  },

  summarizeDrawing(session: StorySession, page: StoryPage): string {
    const hint = page.drawingPrompt.split(".")[0];
    return `A child-created ${session.theme} drawing showing ${hint.toLowerCase()}.`;
  },
};

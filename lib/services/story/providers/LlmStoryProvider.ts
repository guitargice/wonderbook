import { env } from "@/lib/config/env";
import { buildInitialOutlinePrompt } from "@/lib/services/story/prompts/initialOutlinePrompt";
import { buildNextPagePrompt } from "@/lib/services/story/prompts/nextPagePrompt";
import type { SetupInput, StoryOutline, StoryPage } from "@/lib/types/domain";
import type { InitialStoryResult, NextPageResult, StoryProvider } from "./StoryProvider";

const stripCodeFence = (value: string): string =>
  value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

export class LlmStoryProvider implements StoryProvider {
  async generateInitial(input: SetupInput): Promise<InitialStoryResult> {
    const prompt = buildInitialOutlinePrompt(input);
    const content = await this.callModel(prompt);
    const parsed = JSON.parse(stripCodeFence(content)) as Record<string, unknown>;

    // Support both response shapes:
    // 1) { outline: {...}, openingIntro, firstPageText, firstDrawingPrompt }
    // 2) { title, worldRules, recurringCharacters, importantObjects, arcSummary, totalPages, openingIntro, ... }
    const nestedOutline = parsed.outline as StoryOutline | undefined;
    const outline: StoryOutline = nestedOutline ?? {
      title: String(parsed.title ?? "").trim(),
      worldRules: toStringArray(parsed.worldRules),
      recurringCharacters: toStringArray(parsed.recurringCharacters),
      importantObjects: toStringArray(parsed.importantObjects),
      arcSummary: toStringArray(parsed.arcSummary),
      totalPages: Number(parsed.totalPages ?? 0),
    };

    if (!outline.title) {
      throw new Error("LLM initial outline missing title.");
    }

    return {
      outline,
      openingIntro: String(parsed.openingIntro ?? ""),
      firstPageText: String(parsed.firstPageText ?? ""),
      firstDrawingPrompt: String(parsed.firstDrawingPrompt ?? ""),
    };
  }

  async generateNext(input: {
    setup: SetupInput;
    outline: StoryOutline;
    priorPages: StoryPage[];
    latestDrawingSummary?: string;
    nextPageNumber: number;
  }): Promise<NextPageResult> {
    const prompt = buildNextPagePrompt(input);
    const content = await this.callModel(prompt);
    return JSON.parse(stripCodeFence(content)) as NextPageResult;
  }

  private async callModel(prompt: string): Promise<string> {
    if (!env.llmApiKey) {
      throw new Error("LLM_API_KEY missing");
    }

    const response = await fetch(`${env.llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.llmApiKey}`,
      },
      body: JSON.stringify({
        model: env.llmModel,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a child-safe story assistant. Output valid JSON only with no markdown wrappers.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM returned empty content");
    return content;
  }
}

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim());
};

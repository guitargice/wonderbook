import type { SetupInput, StoryOutline, StoryPage } from "@/lib/types/domain";

type BuildNextPagePromptInput = {
  setup: SetupInput;
  outline: StoryOutline;
  priorPages: StoryPage[];
  latestDrawingSummary?: string;
  nextPageNumber: number;
};

export const buildNextPagePrompt = (input: BuildNextPagePromptInput): string => {
  const priorSummaries = input.priorPages
    .map((page) => `Page ${page.pageNumber}: ${page.storyText}`)
    .join("\n");
  const theme =
    input.setup.theme === "custom" ? input.setup.customTheme || "custom family story world" : input.setup.theme;

  return `
You are continuing a high-quality, child-safe interactive story. Return JSON only.

Story constraints:
- Theme: ${theme}
- Tone: ${input.setup.tone}
- Target age: ${input.setup.targetAge}
- World rules: ${input.outline.worldRules.join(", ")}
- Recurring characters: ${input.outline.recurringCharacters.join(", ")}
- Important objects: ${input.outline.importantObjects.join(", ")}
- Arc summary: ${input.outline.arcSummary.join(" -> ")}
- Next page number: ${input.nextPageNumber} of ${input.outline.totalPages}
- Latest child drawing summary: ${input.latestDrawingSummary || "none available"}

Prior page summaries:
${priorSummaries}

Continuity requirements:
- Reference earlier events/objects naturally.
- Mention the latest drawing contribution when possible.
- Avoid repetition.
- Keep emotional progression coherent and gentle.

Return JSON:
{
  "storyText": "single page paragraph",
  "drawingPrompt": "specific child-friendly drawing instruction",
  "isEndingPage": boolean
}
`;
};

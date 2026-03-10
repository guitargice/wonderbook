import type { SetupInput } from "@/lib/types/domain";

export const buildInitialOutlinePrompt = (input: SetupInput): string => {
  const children = input.children
    .map((child, idx) => `${idx + 1}. ${child.name?.trim() || `Child ${idx + 1}`} (${child.gender})`)
    .join("\n");
  const theme = input.theme === "custom" ? input.customTheme || "custom family adventure" : input.theme;

  return `
You are a children's story architect. Return JSON only.
Goal: Create a coherent, child-safe story outline for an interactive storybook.

Constraints:
- Audience age: ${input.targetAge}
- Tone: ${input.tone}
- Theme: ${theme}
- Child count: ${input.childCount}
- Children:\n${children}
- Story length target: ${input.storyLength}
- Keep language vivid but simple and safe.
- Avoid fear, violence, and unsafe behavior.

Return JSON object with this shape:
{
  "title": "string",
  "worldRules": ["string", "..."],
  "recurringCharacters": ["string", "..."],
  "importantObjects": ["string", "..."],
  "arcSummary": ["page-beat-1", "..."],
  "totalPages": number,
  "openingIntro": "short intro paragraph",
  "firstPageText": "page 1 narrative",
  "firstDrawingPrompt": "clear drawing instruction for a child"
}
`;
};

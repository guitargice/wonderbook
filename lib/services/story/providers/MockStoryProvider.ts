import type { SetupInput, StoryOutline } from "@/lib/types/domain";
import type { InitialStoryResult, NextPageResult, StoryProvider } from "./StoryProvider";

const pageCountFromLength = (length: SetupInput["storyLength"]): number => {
  if (length === "short") return 4;
  if (length === "medium") return 7;
  return 10;
};

const safeName = (value: string | undefined, idx: number) => value?.trim() || `Child ${idx + 1}`;

export class MockStoryProvider implements StoryProvider {
  async generateInitial(input: SetupInput): Promise<InitialStoryResult> {
    const lead = safeName(input.children[0]?.name, 0);
    const theme = input.theme === "custom" ? input.customTheme || "custom adventure" : input.theme;
    const totalPages = pageCountFromLength(input.storyLength);

    const outline: StoryOutline = {
      title: `${lead} and the ${capitalize(theme)} Quest`,
      worldRules: ["Kindness unlocks progress", "Curiosity reveals clues", "Every page ends with hope"],
      recurringCharacters: [lead, "A twinkling guide sprite", "A friendly helper creature"],
      importantObjects: ["A glowing story map", "A keepsake charm", "A lantern of ideas"],
      arcSummary: [
        "Invitation to adventure",
        "First challenge and teamwork",
        "Discovery through drawing",
        "Heartwarming resolution",
      ],
      totalPages,
    };

    return {
      outline,
      openingIntro: `In a ${theme} world lit by starlight and laughter, ${lead} discovers a story map that glows when imagination is shared.`,
      firstPageText: `${lead} opens the map and sees a sparkling path toward a mysterious place where brave ideas become real. A tiny guide sprite appears and asks for a first drawing to awaken the path.`,
      firstDrawingPrompt:
        "Draw the main hero and one magical item they carry on the adventure. Use big shapes and favorite colors.",
    };
  }

  async generateNext(input: {
    setup: SetupInput;
    outline: StoryOutline;
    priorPages: { storyText: string; pageNumber: number }[];
    latestDrawingSummary?: string;
    nextPageNumber: number;
  }): Promise<NextPageResult> {
    const isEndingPage = input.nextPageNumber >= input.outline.totalPages;
    const drawingNote = input.latestDrawingSummary
      ? `The drawing inspired this moment: ${input.latestDrawingSummary}.`
      : "The drawing gave the team a bright new idea.";

    if (isEndingPage) {
      return {
        storyText: `At last, the friends reach the final page of the map and realize the real treasure is how they solved each challenge together. ${drawingNote} The world glows warmly as everyone celebrates with a gentle, joyful ending.`,
        drawingPrompt: "Draw a celebration scene with everyone smiling under a glowing sky.",
        isEndingPage: true,
      };
    }

    return {
      storyText: `Page ${input.nextPageNumber} unfolds with a new twist. The group follows the glowing map and finds a playful challenge that can only be solved with imagination and teamwork. ${drawingNote}`,
      drawingPrompt:
        "Draw the next challenge scene and one new detail that helps the heroes move forward.",
      isEndingPage: false,
    };
  }
}

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

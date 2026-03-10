import type { SetupInput, StoryOutline, StoryPage } from "@/lib/types/domain";

export type InitialStoryResult = {
  outline: StoryOutline;
  openingIntro: string;
  firstPageText: string;
  firstDrawingPrompt: string;
};

export type NextPageResult = {
  storyText: string;
  drawingPrompt: string;
  isEndingPage: boolean;
};

export interface StoryProvider {
  generateInitial(input: SetupInput): Promise<InitialStoryResult>;
  generateNext(input: {
    setup: SetupInput;
    outline: StoryOutline;
    priorPages: StoryPage[];
    latestDrawingSummary?: string;
    nextPageNumber: number;
  }): Promise<NextPageResult>;
}

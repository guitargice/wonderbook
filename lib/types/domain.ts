import { z } from "zod";

export const STORY_THEMES = [
  "fantasy kings and queens",
  "dragons",
  "old west",
  "sci-fi",
  "modern day adventure",
  "pirates",
  "jungle",
  "space explorers",
  "bedtime calm story",
  "custom",
] as const;

export const STORY_TONES = [
  "funny",
  "adventurous",
  "gentle",
  "magical",
  "suspenseful but kid-safe",
] as const;

export const STORY_LENGTHS = ["short", "medium", "long"] as const;
export const STORY_STATUSES = ["active", "completed"] as const;
export const GENERATION_STATUSES = ["idle", "pending", "complete", "failed"] as const;

export type StoryTheme = (typeof STORY_THEMES)[number];
export type StoryTone = (typeof STORY_TONES)[number];
export type StoryLength = (typeof STORY_LENGTHS)[number];
export type StoryStatus = (typeof STORY_STATUSES)[number];
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export type ChildConfig = {
  name?: string;
  gender: "girl" | "boy";
};

export type StoryOutline = {
  title: string;
  worldRules: string[];
  recurringCharacters: string[];
  importantObjects: string[];
  arcSummary: string[];
  totalPages: number;
};

export type StorySession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  theme: StoryTheme | string;
  tone: StoryTone | string;
  targetAge: string;
  childCount: number;
  childrenConfig: ChildConfig[];
  storyLength: StoryLength;
  storyOutline: StoryOutline;
  currentPageNumber: number;
  status: StoryStatus;
};

export type StoryPage = {
  id: string;
  storySessionId: string;
  pageNumber: number;
  storyText: string;
  drawingPrompt: string;
  drawingImageUrl: string | null;
  drawingSummary: string | null;
  generatedAnimationUrl: string | null;
  generationStatus: GenerationStatus;
  generationMetadata: Record<string, unknown> | null;
};

export type AnimationJob = {
  id: string;
  pageId: string;
  provider: string;
  status: "pending" | "processing" | "completed" | "failed";
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  simulateReadyAt: string | null;
};

export type SessionAggregate = {
  session: StorySession;
  pages: StoryPage[];
  jobs: AnimationJob[];
};

export const setupSchema = z.object({
  childCount: z.coerce.number().int().min(1).max(4),
  children: z
    .array(
      z.object({
        name: z.string().trim().max(32).optional(),
        gender: z.enum(["girl", "boy"]),
      }),
    )
    .min(1)
    .max(4),
  theme: z.string().min(1).max(64),
  customTheme: z.string().max(120).optional(),
  targetAge: z.string().min(1).max(32),
  storyLength: z.enum(STORY_LENGTHS),
  tone: z.string().min(1).max(40),
});

export type SetupInput = z.infer<typeof setupSchema>;

import type { AnimationJob, SessionAggregate, StoryPage, StorySession } from "@/lib/types/domain";

type MemoryDb = {
  sessions: StorySession[];
  pages: StoryPage[];
  jobs: AnimationJob[];
};

const globalForMemory = globalThis as unknown as { __storybookMemoryDb?: MemoryDb };

const createDefaultDb = (): MemoryDb => ({
  sessions: [],
  pages: [],
  jobs: [],
});

export const memoryDb: MemoryDb = globalForMemory.__storybookMemoryDb ?? createDefaultDb();
globalForMemory.__storybookMemoryDb = memoryDb;

export const getAggregateFromMemory = (sessionId: string): SessionAggregate | null => {
  const session = memoryDb.sessions.find((item) => item.id === sessionId);
  if (!session) return null;

  const pages = memoryDb.pages
    .filter((item) => item.storySessionId === sessionId)
    .sort((a, b) => a.pageNumber - b.pageNumber);
  const jobs = memoryDb.jobs.filter((item) =>
    pages.some((page) => page.id === item.pageId),
  );

  return { session, pages, jobs };
};

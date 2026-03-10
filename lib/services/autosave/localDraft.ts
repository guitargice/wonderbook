"use client";

type LocalDraft = {
  sessionId: string;
  pageNumber: number;
  drawingDataUrl: string | null;
  updatedAt: string;
};

const storageKey = (sessionId: string) => `storybook:draft:${sessionId}`;

export const localDraft = {
  save(draft: LocalDraft) {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(draft.sessionId), JSON.stringify(draft));
  },

  read(sessionId: string): LocalDraft | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocalDraft;
    } catch {
      return null;
    }
  },

  clear(sessionId: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(storageKey(sessionId));
  },
};

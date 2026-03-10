"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DrawingCanvas } from "@/components/drawing/DrawingCanvas";
import { GenerationOverlay } from "@/components/storybook/GenerationOverlay";
import { PageTurn } from "@/components/storybook/PageTurn";
import { StoryProgress } from "@/components/storybook/StoryProgress";
import { localDraft } from "@/lib/services/autosave/localDraft";
import type { SessionAggregate } from "@/lib/types/domain";

type StoryReaderProps = {
  sessionId: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isVideoUrl = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

export function StoryReader({ sessionId }: StoryReaderProps) {
  const router = useRouter();
  const [aggregate, setAggregate] = useState<SessionAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastFailedJobId, setLastFailedJobId] = useState<string | null>(null);
  const [loopVideo, setLoopVideo] = useState(false);

  const currentPage = useMemo(() => {
    if (!aggregate) return null;
    return (
      aggregate.pages.find((item) => item.pageNumber === aggregate.session.currentPageNumber) ??
      aggregate.pages.at(-1) ??
      null
    );
  }, [aggregate]);

  const previousPage = useMemo(() => {
    if (!aggregate || !currentPage) return null;
    return (
      aggregate.pages.find((item) => item.pageNumber === currentPage.pageNumber - 1) ??
      null
    );
  }, [aggregate, currentPage]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/story/sessions/${sessionId}`);
    const result = (await response.json()) as SessionAggregate | { error: string };
    if (!response.ok || "error" in result) {
      throw new Error(("error" in result ? result.error : "Failed to load session.") || "Unknown error");
    }
    setAggregate(result);
    return result;
  }, [sessionId]);

  useEffect(() => {
    refresh()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (
      aggregate &&
      aggregate.session.status === "completed" &&
      aggregate.session.currentPageNumber >= aggregate.session.storyOutline.totalPages
    ) {
      router.push(`/story/${sessionId}/final`);
    }
  }, [aggregate, router, sessionId]);

  useEffect(() => {
    const draft = localDraft.read(sessionId);
    if (draft && aggregate && draft.pageNumber === aggregate.session.currentPageNumber) {
      setDraftDrawing(draft.drawingDataUrl);
    }
  }, [aggregate, sessionId]);

  useEffect(() => {
    if (!aggregate) return;
    localDraft.save({
      sessionId,
      pageNumber: aggregate.session.currentPageNumber,
      drawingDataUrl: draftDrawing,
      updatedAt: new Date().toISOString(),
    });
  }, [aggregate, draftDrawing, sessionId]);

  const pollJobUntilComplete = async (jobId: string) => {
    for (let attempt = 0; attempt < 25; attempt += 1) {
      await delay(900);
      const response = await fetch(`/api/animation/jobs/${jobId}`);
      const job = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) throw new Error(job.error || "Unable to fetch generation status.");
      if (job.status === "completed") return true;
      if (job.status === "failed") {
        setLastFailedJobId(jobId);
        throw new Error("Animation generation failed. You can retry this page.");
      }
    }
    throw new Error("Generation timed out. Please retry.");
  };

  const submitDrawing = async () => {
    if (!currentPage) return;
    if (!draftDrawing) {
      setError("Please add a drawing before turning the page.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    setLastFailedJobId(null);

    try {
      const response = await fetch(`/api/story/sessions/${sessionId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: currentPage.id,
          drawingDataUrl: draftDrawing,
        }),
      });
      const result = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !result.jobId) {
        throw new Error(result.error || "Unable to submit drawing.");
      }

      await pollJobUntilComplete(result.jobId);
      await refresh();
      setDraftDrawing(null);
      localDraft.clear(sessionId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to turn page.");
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFailedJob = async () => {
    if (!lastFailedJobId) return;
    setIsGenerating(true);
    setError(null);
    try {
      await fetch(`/api/animation/jobs/${lastFailedJobId}`, { method: "POST" });
      await pollJobUntilComplete(lastFailedJobId);
      await refresh();
      setLastFailedJobId(null);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <p className="text-center text-indigo-900">Opening your storybook...</p>;
  }

  if (error && !aggregate) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        {error}
      </div>
    );
  }

  if (!aggregate || !currentPage) {
    return <p className="text-center text-slate-600">No story content yet.</p>;
  }

  return (
    <div className="relative grid gap-5 lg:grid-cols-[2fr_1fr]">
      <GenerationOverlay visible={isGenerating} />
      <div className="space-y-4">
        <PageTurn pageKey={String(currentPage.pageNumber)}>
          <section className="rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-md">
            <h2 className="mb-2 text-2xl font-bold text-indigo-900">{aggregate.session.title}</h2>
            <p className="whitespace-pre-line text-slate-700">{currentPage.storyText}</p>
            <div className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">
              <strong>Draw next:</strong> {currentPage.drawingPrompt}
            </div>
          </section>
        </PageTurn>

      </div>

      <aside className="space-y-4">
        <StoryProgress
          current={aggregate.session.currentPageNumber}
          total={aggregate.session.storyOutline.totalPages}
        />
        <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-900">Latest animated page</p>
            {previousPage?.generatedAnimationUrl && isVideoUrl(previousPage.generatedAnimationUrl) ? (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-indigo-700">
                <input
                  type="checkbox"
                  checked={loopVideo}
                  onChange={(e) => setLoopVideo(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-indigo-500"
                />
                Loop
              </label>
            ) : null}
          </div>
          {previousPage?.generatedAnimationUrl ? (
            isVideoUrl(previousPage.generatedAnimationUrl) ? (
              <video
                src={previousPage.generatedAnimationUrl}
                controls
                autoPlay
                muted
                loop={loopVideo}
                playsInline
                className="h-auto w-full rounded-xl border border-indigo-100 object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previousPage.generatedAnimationUrl}
                alt="Generated animation"
                className="h-auto w-full rounded-xl border border-indigo-100 object-cover"
              />
            )
          ) : (
            <p className="text-sm text-slate-500">Your generated scene will appear here after page turn.</p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </aside>

      <section className="rounded-3xl border border-indigo-100 bg-white/90 p-4 shadow-md lg:col-span-2">
        <p className="mb-3 text-sm font-semibold text-indigo-900">Create the next scene</p>
        <DrawingCanvas height={520} onExportChange={setDraftDrawing} initialImage={draftDrawing} />
        <div className="mt-5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={submitDrawing}
            disabled={isGenerating}
            className="w-full max-w-md rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-center font-semibold text-white shadow-md disabled:opacity-60"
          >
            {isGenerating ? "Animating..." : "Submit Drawing & Turn Page"}
          </button>
          {lastFailedJobId ? (
            <button
              type="button"
              onClick={retryFailedJob}
              className="w-full max-w-md rounded-2xl bg-amber-100 px-5 py-3 font-semibold text-amber-900"
            >
              Retry Generation
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

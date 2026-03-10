import { animationJobRepo } from "@/lib/repositories/animationJobRepo";
import { storyPageRepo } from "@/lib/repositories/storyPageRepo";
import { storySessionRepo } from "@/lib/repositories/storySessionRepo";
import { animationService } from "@/lib/services/animation/AnimationService";
import { mediaStorage } from "@/lib/services/storage/mediaStorage";
import { storyService } from "@/lib/services/story/StoryService";
import { setupSchema, type SessionAggregate, type SetupInput, type StoryPage, type StorySession } from "@/lib/types/domain";
import { createHash } from "node:crypto";

const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const sha256 = (input: string) => createHash("sha256").update(input).digest("hex");

type CreateSessionResponse = {
  sessionId: string;
  pageId: string;
};

const parseSessionSetupToInput = (session: StorySession): SetupInput => ({
  childCount: session.childCount,
  children: session.childrenConfig,
  theme: session.theme,
  customTheme: session.theme === "custom" ? session.theme : undefined,
  targetAge: session.targetAge,
  storyLength: session.storyLength,
  tone: session.tone,
});

export const storyWorkflow = {
  async createSession(rawInput: unknown): Promise<CreateSessionResponse> {
    const input = setupSchema.parse(rawInput);
    const generated = await storyService.generateInitial(input);
    const timestamp = nowIso();
    const sessionId = id();
    const firstPageId = id();
    const theme = input.theme === "custom" ? input.customTheme || "custom" : input.theme;
    const combinedFirstText = `${generated.openingIntro}\n\n${generated.firstPageText}`;

    const session: StorySession = {
      id: sessionId,
      createdAt: timestamp,
      updatedAt: timestamp,
      title: generated.sessionTitle,
      theme,
      tone: input.tone,
      targetAge: input.targetAge,
      childCount: input.childCount,
      childrenConfig: input.children,
      storyLength: input.storyLength,
      storyOutline: generated.outline,
      currentPageNumber: 1,
      status: "active",
    };

    const firstPage: StoryPage = {
      id: firstPageId,
      storySessionId: sessionId,
      pageNumber: 1,
      storyText: combinedFirstText,
      drawingPrompt: generated.firstDrawingPrompt,
      drawingImageUrl: null,
      drawingSummary: null,
      generatedAnimationUrl: null,
      generationStatus: "idle",
      generationMetadata: null,
    };

    await storySessionRepo.insert(session);
    await storyPageRepo.insert(firstPage);

    return { sessionId, pageId: firstPageId };
  },

  async submitDrawingAndCreateJob(input: { sessionId: string; pageId: string; drawingDataUrl: string }) {
    const aggregate = await storySessionRepo.getAggregate(input.sessionId);
    if (!aggregate) {
      throw new Error("Story session not found.");
    }
    const page = aggregate.pages.find((item) => item.id === input.pageId);
    if (!page) {
      throw new Error("Story page not found.");
    }

    const storedDrawing = await mediaStorage.persistDrawing({
      sessionId: input.sessionId,
      pageId: input.pageId,
      drawingDataUrl: input.drawingDataUrl,
    });
    console.log(
      "[storybook] drawing image url:",
      storedDrawing.animationInputUrl,
      "public:",
      storedDrawing.isPublicUrl,
    );

    await storyPageRepo.update(page.id, {
      drawingImageUrl: storedDrawing.drawingImageUrl,
      generationStatus: "pending",
    });

    const jobFromProvider = await animationService.createJob({
      session: aggregate.session,
      currentPage: page,
      drawingImageUrl: storedDrawing.animationInputUrl,
    });

    const jobId = id();
    const timestamp = nowIso();

    if (jobFromProvider.providerStatus === "completed" && jobFromProvider.videoBytes) {
      const persisted = await mediaStorage.persistVideoBytes({
        sessionId: input.sessionId,
        pageId: page.id,
        videoBytes: jobFromProvider.videoBytes,
      });

      await storyPageRepo.update(page.id, {
        generationStatus: "complete",
        generatedAnimationUrl: persisted.generatedAnimationUrl,
        generationMetadata: jobFromProvider.metadata ?? null,
        drawingSummary: page.drawingSummary || "Child added a creative scene detail.",
      });

      await this.advanceStory(aggregate, page);

      await animationJobRepo.insert({
        id: jobId,
        pageId: page.id,
        provider: animationService.getProviderName(),
        status: "completed",
        requestPayload: {
          drawingImageUrl: storedDrawing.animationInputUrl,
          storagePath: storedDrawing.storagePath,
        },
        responsePayload: {
          animationUrl: persisted.generatedAnimationUrl,
          animationStoragePath: persisted.storagePath,
          ...jobFromProvider.metadata,
        },
        errorMessage: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        simulateReadyAt: null,
      });

      return { jobId, drawingImageUrl: storedDrawing.animationInputUrl, drawingUrlPublic: storedDrawing.isPublicUrl };
    }

    const readyAt = new Date(Date.now() + 2200).toISOString();
    await animationJobRepo.insert({
      id: jobId,
      pageId: page.id,
      provider: animationService.getProviderName(),
      status: jobFromProvider.providerStatus,
      requestPayload: {
        externalJobId: jobFromProvider.externalJobId,
        drawingImageUrl: storedDrawing.animationInputUrl,
        storagePath: storedDrawing.storagePath,
        drawingImageHash: sha256(storedDrawing.animationInputUrl),
        drawingInputPreview: storedDrawing.animationInputUrl.slice(0, 120),
      },
      responsePayload: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      simulateReadyAt: readyAt,
    });

    return {
      jobId,
      drawingImageUrl: storedDrawing.animationInputUrl,
      drawingUrlPublic: storedDrawing.isPublicUrl,
    };
  },

  async advanceStory(aggregate: SessionAggregate, page: StoryPage) {
    const setupInput = parseSessionSetupToInput(aggregate.session);
    const nextPageNumber = page.pageNumber + 1;

    if (nextPageNumber <= aggregate.session.storyOutline.totalPages) {
      const generated = await storyService.generateNext({
        setup: setupInput,
        outline: aggregate.session.storyOutline,
        priorPages: aggregate.pages,
        latestDrawingSummary: storyService.summarizeDrawing(aggregate.session, page),
        nextPageNumber,
      });

      const nextPage: StoryPage = {
        id: id(),
        storySessionId: aggregate.session.id,
        pageNumber: nextPageNumber,
        storyText: generated.storyText,
        drawingPrompt: generated.drawingPrompt,
        drawingImageUrl: null,
        drawingSummary: null,
        generatedAnimationUrl: null,
        generationStatus: "idle",
        generationMetadata: null,
      };
      await storyPageRepo.insert(nextPage);
      await storySessionRepo.update(aggregate.session.id, {
        currentPageNumber: nextPageNumber,
        status: generated.isEndingPage ? "completed" : "active",
        updatedAt: nowIso(),
      });
    } else {
      await storySessionRepo.update(aggregate.session.id, {
        status: "completed",
        updatedAt: nowIso(),
      });
    }
  },

  async checkJob(jobId: string) {
    const job = await animationJobRepo.getById(jobId);
    if (!job) {
      throw new Error("Animation job not found.");
    }
    if (job.status === "failed" || job.status === "completed") {
      return job;
    }

    const readyAt = job.simulateReadyAt ? new Date(job.simulateReadyAt).getTime() : Date.now();
    if (Date.now() < readyAt) {
      return job;
    }

    const externalJobId = String(job.requestPayload?.externalJobId || "");
    const statusResult = await animationService.getStatus(externalJobId);

    if (statusResult.status === "failed") {
      await animationJobRepo.update(job.id, {
        status: "failed",
        updatedAt: nowIso(),
        errorMessage: statusResult.errorMessage || "Generation failed.",
        responsePayload: statusResult.metadata ?? null,
      });
      return await animationJobRepo.getById(job.id);
    }

    if (statusResult.status === "completed") {
      const page = await storyPageRepo.getById(job.pageId);
      if (!page) throw new Error("Page not found for animation job.");
      const persistedAnimation =
        statusResult.animationUrl
          ? await mediaStorage.persistGeneratedAnimation({
              sessionId: page.storySessionId,
              pageId: page.id,
              providerAnimationUrl: statusResult.animationUrl,
            })
          : null;
      const finalAnimationUrl = persistedAnimation?.generatedAnimationUrl ?? statusResult.animationUrl;

      await storyPageRepo.update(page.id, {
        generationStatus: "complete",
        generatedAnimationUrl: finalAnimationUrl ?? page.generatedAnimationUrl,
        generationMetadata: statusResult.metadata ?? null,
        drawingSummary: page.drawingSummary || "Child added a creative scene detail.",
      });

      const aggregate = await storySessionRepo.getAggregate(page.storySessionId);
      if (!aggregate) throw new Error("Story session missing.");
      await this.advanceStory(aggregate, page);

      await animationJobRepo.update(job.id, {
        status: "completed",
        updatedAt: nowIso(),
        responsePayload: {
          ...statusResult.metadata,
          animationUrl: finalAnimationUrl,
          animationStoragePath: persistedAnimation?.storagePath,
        },
      });
    }

    return await animationJobRepo.getById(job.id);
  },

  async retryJob(jobId: string) {
    const job = await animationJobRepo.getById(jobId);
    if (!job) {
      throw new Error("Animation job not found.");
    }
    await animationJobRepo.update(job.id, {
      status: "pending",
      errorMessage: null,
      updatedAt: nowIso(),
      simulateReadyAt: new Date(Date.now() + 2200).toISOString(),
    });
    return await animationJobRepo.getById(job.id);
  },
};

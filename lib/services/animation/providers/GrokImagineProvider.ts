import { createXai } from "@ai-sdk/xai";
import { experimental_generateVideo as generateVideo } from "ai";
import { env } from "@/lib/config/env";
import type {
  AnimationJobStatusResult,
  AnimationProvider,
  CreateAnimationJobInput,
  CreateAnimationJobResult,
} from "./AnimationProvider";

export class GrokImagineProvider implements AnimationProvider {
  readonly name = "grok-imagine";

  async createJob(input: CreateAnimationJobInput): Promise<CreateAnimationJobResult> {
    const apiKey = env.xaiApiKey || env.grokImagineApiKey;
    if (!apiKey) {
      throw new Error("XAI_API_KEY is not configured.");
    }
    if (!input.drawingImageUrl) {
      throw new Error("Missing drawing image URL for Grok animation.");
    }

    const xai = createXai({ apiKey });

    console.log("[grok-imagine] >>> GENERATE VIDEO (AI SDK)");
    console.log("[grok-imagine]   image:", input.drawingImageUrl);
    console.log("[grok-imagine]   text:", input.prompt);

    const { video } = await generateVideo({
      model: xai.video("grok-imagine-video"),
      prompt: {
        image: input.drawingImageUrl,
        text: input.prompt,
      },
      providerOptions: {
        xai: {
          duration: 5,
          resolution: "480p",
          pollIntervalMs: 5_000,
          pollTimeoutMs: 5 * 60 * 1000,
        },
      },
    });

    console.log("[grok-imagine] <<< VIDEO GENERATED, bytes:", video.uint8Array.length);

    return {
      externalJobId: `sdk-${Date.now()}`,
      providerStatus: "completed",
      videoBytes: video.uint8Array,
      metadata: {
        generatedVia: "ai-sdk",
        imageInput: input.drawingImageUrl,
        byteLength: video.uint8Array.length,
      },
    };
  }

  async getJobStatus(_externalJobId: string): Promise<AnimationJobStatusResult> {
    return { status: "completed" };
  }
}

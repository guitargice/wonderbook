export type CreateAnimationJobInput = {
  prompt: string;
  drawingImageUrl: string;
  sessionId: string;
  pageId: string;
};

export type CreateAnimationJobResult = {
  externalJobId: string;
  providerStatus: "pending" | "processing" | "completed";
  animationUrl?: string;
  videoBytes?: Uint8Array;
  metadata?: Record<string, unknown>;
};

export type AnimationJobStatusResult = {
  status: "pending" | "processing" | "completed" | "failed";
  animationUrl?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
};

export interface AnimationProvider {
  readonly name: string;
  createJob(input: CreateAnimationJobInput): Promise<CreateAnimationJobResult>;
  getJobStatus(externalJobId: string): Promise<AnimationJobStatusResult>;
}

import type {
  AnimationJobStatusResult,
  AnimationProvider,
  CreateAnimationJobInput,
  CreateAnimationJobResult,
} from "./AnimationProvider";

export class MockAnimationProvider implements AnimationProvider {
  readonly name = "mock-animation";

  async createJob(input: CreateAnimationJobInput): Promise<CreateAnimationJobResult> {
    return {
      externalJobId: `mock-${input.pageId}`,
      providerStatus: "pending",
      metadata: { style: "storybook-motion-lite" },
    };
  }

  async getJobStatus(externalJobId: string): Promise<AnimationJobStatusResult> {
    const seed = externalJobId.slice(-8);
    return {
      status: "completed",
      animationUrl: `https://placehold.co/1024x768/png?text=Animated+Page+${seed}`,
      metadata: {
        provider: this.name,
        fps: 12,
        durationSeconds: 4,
      },
    };
  }
}

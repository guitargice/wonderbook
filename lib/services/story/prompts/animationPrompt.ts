import type { StoryPage, StorySession } from "@/lib/types/domain";

type AnimationPromptInput = {
  session: StorySession;
  currentPage: StoryPage;
};

/**
 * For image-to-video, the prompt should describe desired MOTION only.
 * The visual content comes from the image_url — a long scene description
 * causes the model to generate from text instead of animating the image.
 */
export const buildAnimationPrompt = ({ session, currentPage }: AnimationPromptInput): string => {
  const subject = currentPage.drawingPrompt || "the scene";
  const tone = session.tone || "whimsical";
  return `Animate the provided input image exactly as it is. The first frame must match the input image pixel-for-pixel. Add gentle motion to ${subject}: soft floating movement, subtle parallax depth, and a ${tone} looping feel. Do not replace, redraw, or reimagine the image — only add movement to what is already there. Keep it child-friendly.`;
};

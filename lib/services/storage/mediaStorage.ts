import { hasSupabaseConfig } from "@/lib/config/server-env";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";

type PersistDrawingInput = {
  sessionId: string;
  pageId: string;
  drawingDataUrl: string;
};

type PersistDrawingResult = {
  drawingImageUrl: string;
  animationInputUrl: string;
  storagePath?: string;
  isPublicUrl: boolean;
};

type PersistAnimationInput = {
  sessionId: string;
  pageId: string;
  providerAnimationUrl: string;
};

type PersistAnimationResult = {
  generatedAnimationUrl: string;
  storagePath?: string;
};

const parseDataUrl = (value: string): { mimeType: string; base64: string } | null => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
};

const extensionFromMimeType = (mimeType: string): string => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "png";
};

export const mediaStorage = {
  async persistDrawing(input: PersistDrawingInput): Promise<PersistDrawingResult> {
    const parsed = parseDataUrl(input.drawingDataUrl);
    if (!parsed) {
      throw new Error("Drawing export must be a valid image data URI.");
    }
    if (!hasSupabaseConfig()) {
      throw new Error(
        "Public drawing URL required: configure Supabase env vars and make the `drawings` bucket public.",
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      throw new Error(
        "Supabase server client unavailable. Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    try {
      const extension = extensionFromMimeType(parsed.mimeType);
      const storagePath = `${input.sessionId}/${input.pageId}-${Date.now()}.${extension}`;
      const buffer = Buffer.from(parsed.base64, "base64");

      const upload = await supabase.storage.from("drawings").upload(storagePath, buffer, {
        contentType: parsed.mimeType,
        upsert: true,
      });
      if (upload.error) {
        throw new Error(`Failed to upload drawing: ${upload.error.message}`);
      }

      const publicResult = supabase.storage.from("drawings").getPublicUrl(storagePath);
      const publicUrl = publicResult.data.publicUrl;
      const publicCheck = await fetch(publicUrl, { method: "GET" });

      if (!publicCheck.ok) {
        throw new Error(
          "Drawings bucket is not publicly accessible. Make the `drawings` bucket public to use image_url animation.",
        );
      }

      return {
        drawingImageUrl: publicUrl,
        // Send the exact uploaded drawing URL to provider so image-to-video
        // receives a concrete source image resource.
        animationInputUrl: publicUrl,
        storagePath,
        isPublicUrl: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown drawing storage error.";
      throw new Error(`Unable to produce public drawing URL: ${message}`);
    }
  },

  async persistVideoBytes(input: {
    sessionId: string;
    pageId: string;
    videoBytes: Uint8Array;
  }): Promise<PersistAnimationResult> {
    if (!hasSupabaseConfig()) {
      throw new Error("Supabase required to persist generated video.");
    }
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      throw new Error("Supabase server client unavailable.");
    }

    const storagePath = `${input.sessionId}/${input.pageId}-${Date.now()}.mp4`;
    const buffer = Buffer.from(input.videoBytes);

    const upload = await supabase.storage.from("animations").upload(storagePath, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });
    if (upload.error) {
      throw new Error(`Failed to upload video: ${upload.error.message}`);
    }

    const publicResult = supabase.storage.from("animations").getPublicUrl(storagePath);
    const url = publicResult.data.publicUrl;
    console.log("[storage] video uploaded:", url);

    return { generatedAnimationUrl: url, storagePath };
  },

  async persistGeneratedAnimation(input: PersistAnimationInput): Promise<PersistAnimationResult> {
    if (!hasSupabaseConfig()) {
      return { generatedAnimationUrl: input.providerAnimationUrl };
    }
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { generatedAnimationUrl: input.providerAnimationUrl };
    }

    try {
      const response = await fetch(input.providerAnimationUrl);
      if (!response.ok) {
        return { generatedAnimationUrl: input.providerAnimationUrl };
      }

      const contentType = response.headers.get("content-type") || "video/mp4";
      const extension = contentType.includes("webm") ? "webm" : "mp4";
      const bytes = await response.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const storagePath = `${input.sessionId}/${input.pageId}-${Date.now()}.${extension}`;

      const upload = await supabase.storage.from("animations").upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });
      if (upload.error) {
        return { generatedAnimationUrl: input.providerAnimationUrl };
      }

      const signed = await supabase
        .storage
        .from("animations")
        .createSignedUrl(storagePath, 60 * 60 * 24);
      const publicResult = supabase.storage.from("animations").getPublicUrl(storagePath);
      const url = signed.data?.signedUrl || publicResult.data.publicUrl;

      if (!url) {
        return { generatedAnimationUrl: input.providerAnimationUrl };
      }

      return { generatedAnimationUrl: url, storagePath };
    } catch {
      return { generatedAnimationUrl: input.providerAnimationUrl };
    }
  },
};

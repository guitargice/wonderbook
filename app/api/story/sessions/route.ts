import { NextResponse } from "next/server";
import { storyWorkflow } from "@/lib/server/storyWorkflow";

const toErrorPayload = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    const maybe = error as Record<string, unknown>;
    return {
      message: String(maybe.message ?? "Unable to create story session."),
      code: maybe.code ? String(maybe.code) : undefined,
      details: maybe.details ? String(maybe.details) : undefined,
      hint: maybe.hint ? String(maybe.hint) : undefined,
    };
  }
  return { message: "Unable to create story session." };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await storyWorkflow.createSession(body);
    return NextResponse.json(result);
  } catch (error) {
    const payload = toErrorPayload(error);
    console.error("[story-sessions:create] failed", payload, error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: payload.message, debug: payload }, { status: 400 });
    }
    return NextResponse.json({ error: payload.message }, { status: 400 });
  }
}

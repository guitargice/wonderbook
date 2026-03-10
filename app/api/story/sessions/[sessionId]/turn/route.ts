import { NextResponse } from "next/server";
import { storyWorkflow } from "@/lib/server/storyWorkflow";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as { pageId: string; drawingDataUrl: string };
    const { sessionId } = await context.params;
    if (!body.pageId || !body.drawingDataUrl) {
      return NextResponse.json({ error: "Missing pageId or drawingDataUrl" }, { status: 400 });
    }
    const result = await storyWorkflow.submitDrawingAndCreateJob({
      sessionId,
      pageId: body.pageId,
      drawingDataUrl: body.drawingDataUrl,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit drawing.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

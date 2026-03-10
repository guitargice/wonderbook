import { NextResponse } from "next/server";
import { storyWorkflow } from "@/lib/server/storyWorkflow";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const job = await storyWorkflow.checkJob(jobId);
    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch job status.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const job = await storyWorkflow.retryJob(jobId);
    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retry job.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

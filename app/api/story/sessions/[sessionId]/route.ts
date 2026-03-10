import { NextResponse } from "next/server";
import { storySessionRepo } from "@/lib/repositories/storySessionRepo";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const aggregate = await storySessionRepo.getAggregate(sessionId);
  if (!aggregate) {
    return NextResponse.json({ error: "Story session not found." }, { status: 404 });
  }
  return NextResponse.json(aggregate);
}

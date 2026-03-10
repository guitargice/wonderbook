import Link from "next/link";
import { StorybookLayout } from "@/components/storybook/StorybookLayout";
import { storySessionRepo } from "@/lib/repositories/storySessionRepo";

type FinalPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function FinalPage({ params }: FinalPageProps) {
  const { sessionId } = await params;
  const aggregate = await storySessionRepo.getAggregate(sessionId);

  if (!aggregate) {
    return (
      <StorybookLayout>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Story session not found.
        </div>
      </StorybookLayout>
    );
  }

  const endingPage = aggregate.pages.at(-1);
  const isVideoUrl = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

  return (
    <StorybookLayout>
      <main className="space-y-6">
        <section className="rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-md">
          <h1 className="text-3xl font-bold text-indigo-900">The End</h1>
          <p className="mt-3 whitespace-pre-line text-slate-700">
            {endingPage?.storyText || "Your story adventure has wrapped up beautifully."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/story/${sessionId}`}
              className="rounded-xl bg-indigo-100 px-4 py-2 font-semibold text-indigo-800"
            >
              Replay Story
            </Link>
            <a
              href={`/api/export/${sessionId}`}
              className="rounded-xl bg-fuchsia-100 px-4 py-2 font-semibold text-fuchsia-800"
            >
              Export Session JSON
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-indigo-900">Story timeline gallery</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {aggregate.pages.map((page) => (
              <article key={page.id} className="rounded-2xl border border-indigo-100 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-indigo-700">Page {page.pageNumber}</p>
                <p className="mb-3 text-sm text-slate-700">{page.storyText}</p>
                {page.generatedAnimationUrl ? (
                  isVideoUrl(page.generatedAnimationUrl) ? (
                    <video
                      src={page.generatedAnimationUrl}
                      controls
                      className="h-auto rounded-xl border border-indigo-100"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.generatedAnimationUrl}
                      alt={`Generated media for page ${page.pageNumber}`}
                      className="h-auto rounded-xl border border-indigo-100"
                    />
                  )
                ) : (
                  <p className="text-xs text-slate-500">No generated media for this page.</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </StorybookLayout>
  );
}

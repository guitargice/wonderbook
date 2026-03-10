import Link from "next/link";
import { StorybookLayout } from "@/components/storybook/StorybookLayout";

export default function Home() {
  return (
    <StorybookLayout>
      <main className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col items-center justify-center">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-8 py-12 text-center shadow-xl md:px-14">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            AI Powered Interactive Storybook
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-indigo-950 md:text-5xl">
            Turn your child&apos;s drawings into a living magical story
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Parents shape the adventure, kids draw each next scene, and every page animates into a
            premium bedtime-ready storybook.
          </p>
          <div className="mt-8">
            <Link
              href="/setup"
              className="inline-flex rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition hover:scale-[1.01]"
            >
              Start a Story
            </Link>
          </div>
        </div>
      </main>
    </StorybookLayout>
  );
}

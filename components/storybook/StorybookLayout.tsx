import type { ReactNode } from "react";

type StorybookLayoutProps = {
  children: ReactNode;
};

export function StorybookLayout({ children }: StorybookLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#c7d2fe_0%,#eef2ff_42%,#fffdf7_100%)] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
        <header className="mb-6 flex items-center justify-between rounded-3xl border border-white/60 bg-white/65 px-5 py-3 shadow-lg shadow-indigo-100 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Wonderbook AI
          </p>
          <p className="text-sm text-slate-500">Make your drawings come alive</p>
        </header>
        {children}
      </div>
    </div>
  );
}

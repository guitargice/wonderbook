"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StorybookLayout } from "@/components/storybook/StorybookLayout";
import { STORY_LENGTHS, STORY_THEMES, STORY_TONES } from "@/lib/types/domain";

const childGenders = ["girl", "boy"] as const;

export default function SetupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childCount, setChildCount] = useState(1);
  const [childrenState, setChildrenState] = useState([
    { name: "", gender: "girl" as (typeof childGenders)[number] },
  ]);
  const [theme, setTheme] = useState("fantasy kings and queens");

  const childrenRows = useMemo(() => {
    return Array.from({ length: childCount }).map((_, index) => {
      return childrenState[index] || { name: "", gender: "girl" };
    });
  }, [childCount, childrenState]);

  const setChild = (index: number, patch: { name?: string; gender?: (typeof childGenders)[number] }) => {
    setChildrenState((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || { name: "", gender: "girl" }), ...patch };
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      childCount,
      children: childrenRows.map((child, index) => ({
        name: child.name?.trim() || undefined,
        gender: child.gender,
        fallbackLabel: `Child ${index + 1}`,
      })),
      theme,
      customTheme: String(formData.get("customTheme") || ""),
      targetAge: String(formData.get("targetAge") || "5-8"),
      storyLength: String(formData.get("storyLength") || "short"),
      tone: String(formData.get("tone") || "magical"),
    };

    try {
      const response = await fetch("/api/story/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !result.sessionId) {
        throw new Error(result.error || "Failed to create session.");
      }
      router.push(`/story/${result.sessionId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StorybookLayout>
      <main className="mx-auto w-full max-w-4xl rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl md:p-10">
        <h1 className="text-3xl font-bold text-indigo-900">Create your custom story</h1>
        <p className="mt-2 text-slate-600">
          Configure once, then turn each drawing into the next magical page.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Number of kids</span>
              <input
                type="number"
                min={1}
                max={4}
                value={childCount}
                onChange={(event) => setChildCount(Math.min(4, Math.max(1, Number(event.target.value))))}
                className="w-full rounded-xl border border-indigo-100 px-3 py-2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Audience age range</span>
              <input
                name="targetAge"
                defaultValue="5-8"
                className="w-full rounded-xl border border-indigo-100 px-3 py-2"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-indigo-100 p-4">
            <p className="mb-3 text-sm font-semibold text-indigo-900">Children in the story</p>
            <div className="space-y-3">
              {childrenRows.map((child, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-2">
                  <input
                    placeholder={`Child ${index + 1} name (optional)`}
                    value={child.name}
                    onChange={(event) => setChild(index, { name: event.target.value })}
                    className="rounded-xl border border-indigo-100 px-3 py-2"
                  />
                  <select
                    value={child.gender}
                    onChange={(event) => setChild(index, { gender: event.target.value as (typeof childGenders)[number] })}
                    className="rounded-xl border border-indigo-100 px-3 py-2"
                  >
                    {childGenders.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Theme</span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="w-full rounded-xl border border-indigo-100 px-3 py-2"
              >
                {STORY_THEMES.map((themeOption) => (
                  <option key={themeOption} value={themeOption}>
                    {themeOption}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Custom theme (optional)</span>
              <input
                name="customTheme"
                placeholder="Moonlight bakery adventure..."
                className="w-full rounded-xl border border-indigo-100 px-3 py-2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Story length</span>
              <select name="storyLength" className="w-full rounded-xl border border-indigo-100 px-3 py-2">
                {STORY_LENGTHS.map((length) => (
                  <option key={length} value={length}>
                    {length}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-indigo-900">Tone</span>
              <select name="tone" className="w-full rounded-xl border border-indigo-100 px-3 py-2">
                {STORY_TONES.map((toneOption) => (
                  <option key={toneOption} value={toneOption}>
                    {toneOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting ? "Starting story..." : "Start Story"}
          </button>
        </form>
      </main>
    </StorybookLayout>
  );
}

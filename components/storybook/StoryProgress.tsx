type StoryProgressProps = {
  current: number;
  total: number;
};

export function StoryProgress({ current, total }: StoryProgressProps) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(100, Math.round((current / safeTotal) * 100));
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-indigo-900">
        <span className="font-semibold">Story Progress</span>
        <span>
          Page {current} / {total}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

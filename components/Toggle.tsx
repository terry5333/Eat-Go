"use client";

export function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 shadow-soft ring-1 ring-white/10 hover:bg-white/10 transition"
    >
      <span className="text-sm text-zinc-200">{label}</span>
      <span
        className={[
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-500/80" : "bg-zinc-700"
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            checked ? "left-5" : "left-0.5"
          ].join(" ")}
        />
      </span>
    </button>
  );
}

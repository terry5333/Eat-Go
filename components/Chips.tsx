"use client";

export function Chips<T extends string>({
  options,
  value,
  onChange
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              "rounded-full px-4 py-2 text-sm transition ring-1",
              active
                ? "bg-white text-zinc-950 ring-white"
                : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

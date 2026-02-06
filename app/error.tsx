"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <h1 className="text-2xl font-bold">EatGo 掛了 🧯</h1>
        <p className="mt-2 text-zinc-300">
          你的頁面不是沒東西，是前端在瀏覽器報錯，所以白屏。下面是錯誤訊息：
        </p>

        <pre className="mt-4 overflow-auto rounded-2xl bg-zinc-900/60 p-4 text-xs text-zinc-200 ring-1 ring-white/10">
{String(error?.message ?? error)}
        </pre>

        {error?.digest ? (
          <p className="mt-3 text-xs text-zinc-400">digest: {error.digest}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => reset()}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950"
          >
            重新載入
          </button>
          <a
            href="/"
            className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-200 ring-1 ring-white/10"
          >
            回首頁
          </a>
        </div>
      </div>
    </main>
  );
}

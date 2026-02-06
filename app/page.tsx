import HomeClient from "@/components/HomeClient";

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 shadow-soft">
          <h1 className="text-2xl font-bold">EatGo</h1>
          <p className="mt-2 text-sm text-zinc-300">✅ SSR fallback</p>
        </div>
        <div className="mt-6">
          <HomeClient />
        </div>
      </div>
    </main>
  );
}

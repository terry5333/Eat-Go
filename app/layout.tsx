"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FoodCategory, PriceTag, Restaurant, SearchRequest } from "@/lib/types";
import { Chips } from "@/components/Chips";
import { Toggle } from "@/components/Toggle";
import { RestaurantCard } from "@/components/RestaurantCard";

const CATEGORIES: readonly FoodCategory[] = [
  "不限",
  "拉麵",
  "火鍋",
  "咖哩",
  "牛排",
  "早午餐",
  "便當",
  "燒肉",
  "甜點",
  "飲料"
] as const;

// 免費版資料沒有 price_level / rating（這些 UI 會停用顯示）
const PRICE_TAGS: readonly PriceTag[] = ["便宜", "中等", "高級"] as const;

const FAV_KEY = "eatgo:favs:v1";
type Fav = Record<string, Restaurant>;

export default function Page() {
  // location
  const [mode, setMode] = useState<"coords" | "text">("coords");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationText, setLocationText] = useState("");

  // preferences
  const [category, setCategory] = useState<FoodCategory>("不限");
  const [radiusKm, setRadiusKm] = useState<1 | 3 | 5>(3);

  // 免費版只保留「只看營業中（近似）」：其實是用 opening_hours 有無當作近似
  const [openNow, setOpenNow] = useState(false);

  // results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [lastPayload, setLastPayload] = useState<SearchRequest | null>(null);

  // favs
  const [favs, setFavs] = useState<Fav>({});
  const favList = useMemo(() => Object.values(favs), [favs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function persistFavs(next: Fav) {
    setFavs(next);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function toggleFav(placeId: string) {
    const exists = favs[placeId];
    if (exists) {
      const next = { ...favs };
      delete next[placeId];
      persistFavs(next);
      return;
    }
    const found = results.find((r) => r.placeId === placeId);
    if (!found) return;
    persistFavs({ ...favs, [placeId]: found });
  }

  function isFav(placeId: string) {
    return Boolean(favs[placeId]);
  }

  async function getMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("你的瀏覽器不支援定位 😢");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setError("定位失敗：你可能拒絕了定位權限。");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function search(payload: SearchRequest) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "查詢失敗");
      setResults(data.results ?? []);
      setLastPayload(payload);
    } catch (e: any) {
      setError(e?.message ?? "查詢失敗");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (mode === "coords") {
      if (!coords) {
        setError("先按一下「使用目前定位」啦 😤");
        return;
      }
      const payload: SearchRequest = {
        mode: "coords",
        lat: coords.lat,
        lng: coords.lng,
        radiusKm,
        category,
        openNow,
        // 免費版會忽略這些，但型別需要
        minRating: 0,
        priceTags: []
      };
      await search(payload);
      return;
    }

    const t = locationText.trim();
    if (!t) {
      setError("手動地點不能空白（例如：台北 信義）");
      return;
    }
    const payload: SearchRequest = {
      mode: "text",
      locationText: t,
      radiusKm,
      category,
      openNow,
      minRating: 0,
      priceTags: []
    };
    await search(payload);
  }

  async function handleReroll() {
    if (!lastPayload) return;
    await search(lastPayload);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">EatGo</h1>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
              免費模式（OSM）
            </span>
          </div>
          <p className="mt-2 text-zinc-300">
            不知道吃什麼？你選條件，我給你 5 間。免費資料來源：OpenStreetMap。
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            提醒：免費資料通常沒有 Google 那種「評分 / 價位 / 即時營業中」。
            我們用「距離 + 是否有 opening_hours」做 vibe 排序。
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("coords")}
            className={[
              "rounded-2xl px-4 py-3 text-sm ring-1 transition",
              mode === "coords"
                ? "bg-white text-zinc-950 ring-white"
                : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
            ].join(" ")}
          >
            用定位
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={[
              "rounded-2xl px-4 py-3 text-sm ring-1 transition",
              mode === "text"
                ? "bg-white text-zinc-950 ring-white"
                : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
            ].join(" ")}
          >
            手動地點
          </button>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: controls */}
        <div className="rounded-3xl bg-white/5 p-6 shadow-soft ring-1 ring-white/10">
          <div className="flex flex-col gap-5">
            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold">你現在在哪？</h2>

              {mode === "coords" ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={getMyLocation}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
                  >
                    使用目前定位
                  </button>

                  <div className="text-sm text-zinc-300">
                    {coords ? (
                      <span>
                        ✅ 已取得：{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                      </span>
                    ) : (
                      <span>還沒定位（按一下就好）</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="例如：台北 信義 / 高雄 左營 / 台中 西屯"
                    className="w-full rounded-2xl bg-zinc-950/60 px-4 py-3 text-sm text-zinc-50 ring-1 ring-white/10 outline-none focus:ring-white/30"
                  />
                  <p className="mt-2 text-xs text-zinc-400">
                    免費版會用 Nominatim 把文字地點轉成座標。
                  </p>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <h2 className="text-lg font-semibold">今天想吃什麼？</h2>
              <div className="mt-3">
                <Chips options={CATEGORIES} value={category} onChange={setCategory} />
              </div>
            </div>

            {/* Radius */}
            <div>
              <h2 className="text-lg font-semibold">距離</h2>
              <div className="mt-3 flex gap-2">
                {[1, 3, 5].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRadiusKm(k as 1 | 3 | 5)}
                    className={[
                      "rounded-2xl px-4 py-3 text-sm ring-1 transition",
                      radiusKm === k
                        ? "bg-white text-zinc-950 ring-white"
                        : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
                    ].join(" ")}
                  >
                    {k} km
                  </button>
                ))}
              </div>
            </div>

            {/* Open now (approx) */}
            <div className="flex flex-col gap-2">
              <Toggle checked={openNow} onChange={setOpenNow} label="只看「可能可營業」(有 opening_hours)" />
              <p className="text-xs text-zinc-400">
                免費資料無法即時判斷營業中，這個開關會只保留「有標 opening_hours」的店。
              </p>
            </div>

            {/* Disabled controls (price/rating) */}
            <div className="rounded-3xl bg-white/3 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">評分 / 價位</h2>
                <span className="text-xs text-zinc-400">免費模式不支援</span>
              </div>
              <div className="mt-3 opacity-40 pointer-events-none">
                <div className="mb-3 flex flex-wrap gap-2">
                  {PRICE_TAGS.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-200">最低評分</span>
                    <span className="text-sm font-semibold">—</span>
                  </div>
                  <input type="range" min={3.5} max={4.7} step={0.1} value={4.0} readOnly className="mt-2 w-full" />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                之後你想升級 Google Places，再把評分/價位開回來就行。
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "幫你找中…" : "幫我選（列出 5 間）"}
              </button>

              <button
                type="button"
                onClick={handleReroll}
                disabled={loading || !lastPayload}
                className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10 transition disabled:opacity-50"
              >
                再來 5 間
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/20">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: favorites */}
        <div className="rounded-3xl bg-white/5 p-6 shadow-soft ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">收藏清單</h2>
            <span className="text-sm text-zinc-300">{favList.length} 間</span>
          </div>

          {favList.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              看到喜歡的店按「收藏」就會出現在這裡。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {favList
                .sort((a, b) => b.vibeScore - a.vibeScore)
                .slice(0, 8)
                .map((r) => (
                  <a
                    key={r.placeId}
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{r.name}</div>
                        <div className="mt-1 text-xs text-zinc-300">
                          {r.distanceKm.toFixed(2)} km
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFav(r.placeId);
                        }}
                        className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-950"
                      >
                        移除
                      </button>
                    </div>
                  </a>
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">結果</h2>
            <p className="mt-2 text-sm text-zinc-300">
              免費版排序偏向「近」＋「有 opening_hours」。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {results.map((r) => (
              <RestaurantCard
                key={r.placeId}
                r={r}
                onToggleFav={toggleFav}
                isFav={isFav(r.placeId)}
              />
            ))}
          </AnimatePresence>
        </div>

        {!loading && results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-3xl bg-white/5 p-6 text-sm text-zinc-300 ring-1 ring-white/10"
          >
            目前沒有結果。你可以：
            <ul className="mt-2 list-disc pl-5 text-zinc-300">
              <li>距離改成 5 km</li>
              <li>類型改「不限」</li>
              <li>關掉「只看可能可營業」</li>
              <li>手動地點換個寫法（例如：台北 中山 / 台中 北區）</li>
            </ul>
          </motion.div>
        ) : null}
      </section>

      <footer className="mt-14 pb-10 text-center text-xs text-zinc-500">
        EatGo・free vibe coding edition (OSM)
      </footer>
    </main>
  );
}

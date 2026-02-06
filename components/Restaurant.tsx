"use client";

import { motion } from "framer-motion";
import type { Restaurant } from "@/lib/types";

export function RestaurantCard({
  r,
  onToggleFav,
  isFav
}: {
  r: Restaurant;
  onToggleFav: (placeId: string) => void;
  isFav: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-3xl bg-white/5 shadow-soft ring-1 ring-white/10"
    >
      {/* 免費版通常沒有照片 */}
      <div className="h-44 w-full bg-gradient-to-br from-white/10 to-white/0" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{r.name}</h3>
            <p className="mt-1 text-sm text-zinc-300">
              {r.isOpenNow ? "🟢 可能可營業（有 opening_hours）" : "⚫ 未知"} ・ {r.distanceKm.toFixed(2)} km
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleFav(r.placeId)}
            className={[
              "shrink-0 rounded-2xl px-3 py-2 text-sm ring-1 transition",
              isFav
                ? "bg-amber-400 text-zinc-950 ring-amber-300"
                : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
            ].join(" ")}
            title="收藏"
          >
            {isFav ? "★ 已收藏" : "☆ 收藏"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-200">
          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
            vibe {r.vibeScore.toFixed(2)}
          </span>
        </div>

        {r.address ? (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-300">{r.address}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <a
            href={r.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
          >
            看地圖 / 導航
          </a>

          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(r.name)}
            className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10 transition"
          >
            複製店名
          </button>
        </div>
      </div>
    </motion.div>
  );
}

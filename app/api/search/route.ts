import { NextResponse } from "next/server";
import type { SearchRequest, Restaurant, FoodCategory } from "@/lib/types";
import { haversineKm } from "@/lib/distance";

export const runtime = "nodejs";

function jsonError(message: string, status = 500, extra?: any) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function safeFetchText(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text(); // 先拿文字，避免 res.json() 爆
  return { res, text };
}

async function safeFetchJson(url: string, init?: RequestInit) {
  const { res, text } = await safeFetchText(url, init);
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${text.slice(0, 200) || "(empty body)"}`);
  }
  if (!text.trim()) {
    throw new Error("Upstream returned empty body");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Upstream returned non-JSON: ${text.slice(0, 200)}`);
  }
}

function mapsUrlFromLatLng(lat: number, lng: number, name?: string) {
  const u = new URL("https://www.google.com/maps/search/");
  const q = name ? `${name} @ ${lat},${lng}` : `${lat},${lng}`;
  u.searchParams.set("api", "1");
  u.searchParams.set("query", q);
  return u.toString();
}

async function nominatimGeocode(q: string): Promise<{ lat: number; lng: number; displayName: string }> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const data = await safeFetchJson(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "EatGo (free OSM demo)",
      "Accept-Language": "zh-TW"
    }
  });

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("找不到這個地點，換個寫法試試（例如：台北 信義 / 台中 西屯）");
  }

  const item = data[0];
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("地點轉座標失敗，請換個地點名稱再試一次");
  }
  return { lat, lng, displayName: item.display_name ?? q };
}

function categoryToOverpassFilter(cat: FoodCategory) {
  const amenityBase = `nwr["amenity"~"restaurant|cafe|fast_food|food_court"];`;

  if (cat === "不限") return { amenity: amenityBase, cuisineRegex: "" };

  const cuisineMap: Record<Exclude<FoodCategory, "不限">, string> = {
    "拉麵": "ramen|japanese",
    "火鍋": "hotpot|chinese",
    "咖哩": "curry|indian|japanese",
    "牛排": "steak|steak_house|american",
    "早午餐": "breakfast|brunch|coffee_shop",
    "便當": "taiwanese|regional|chinese",
    "燒肉": "barbecue|bbq|japanese|korean",
    "甜點": "dessert|ice_cream|confectionery|bakery",
    "飲料": "coffee_shop|tea|bubble_tea|juice"
  };

  return { amenity: amenityBase, cuisineRegex: cuisineMap[cat as Exclude<FoodCategory, "不限">] ?? "" };
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function overpassNearby(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  category: FoodCategory;
}) {
  const { lat, lng, radiusMeters, category } = params;
  const { amenity, cuisineRegex } = categoryToOverpassFilter(category);
  const around = `(around:${radiusMeters},${lat},${lng})`;

  const cuisineBlock = cuisineRegex
    ? `
    (
      nwr${around}["amenity"~"restaurant|cafe|fast_food|food_court"]["cuisine"~"${cuisineRegex}"];
      nwr${around}["shop"~"bakery|confectionery|ice_cream|beverages"]["cuisine"~"${cuisineRegex}"];
    );
  `
    : "";

  const query = `
  [out:json][timeout:25];
  (
    ${amenity}
    nwr${around}["shop"~"bakery|confectionery|ice_cream|beverages"];
    ${cuisineBlock}
  );
  out center 120;
  `;

  const data = await safeFetchJson("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": "EatGo (free OSM demo)"
    },
    body: query
  });

  const elements = (data?.elements ?? []) as OverpassElement[];
  return elements;
}

function pickLatLng(el: OverpassElement) {
  if (typeof el.lat === "number" && typeof el.lon === "number") return { lat: el.lat, lng: el.lon };
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function buildAddress(tags?: Record<string, string>) {
  if (!tags) return undefined;
  const parts = [
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:subdistrict"],
    tags["addr:street"],
    tags["addr:housenumber"]
  ].filter(Boolean);
  const s = parts.join("");
  return s || tags["addr:full"] || undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchRequest;

    let lat = body.lat ?? 0;
    let lng = body.lng ?? 0;

    if (body.mode === "text") {
      const t = (body.locationText ?? "").trim();
      if (!t) return jsonError("locationText is required for text mode", 400);
      const g = await nominatimGeocode(t);
      lat = g.lat;
      lng = g.lng;
    } else {
      if (typeof lat !== "number" || typeof lng !== "number") {
        return jsonError("lat/lng required for coords mode", 400);
      }
    }

    const radiusMeters = Math.round(body.radiusKm * 1000);

    const els = await overpassNearby({
      lat,
      lng,
      radiusMeters,
      category: body.category
    });

    const seen = new Set<string>();
    const items: Restaurant[] = [];

    for (const el of els) {
      const ll = pickLatLng(el);
      if (!ll) continue;

      const tags = el.tags ?? {};
      const name = tags["name"] || tags["brand"] || tags["name:zh"] || tags["name:zh-Hant"];
      if (!name) continue;

      const d = haversineKm(lat, lng, ll.lat, ll.lng);
      const key = `${name}:${Math.round(d * 1000)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const hasOpeningHours = Boolean(tags["opening_hours"]);
      const pseudoOpenNow = body.openNow ? hasOpeningHours : undefined;

      const vibe = (hasOpeningHours ? 0.6 : 0) - d * 0.2;

      items.push({
        placeId: `osm:${el.type}:${el.id}`,
        name,
        rating: undefined,
        userRatingsTotal: undefined,
        priceLevel: undefined,
        address: buildAddress(tags),
        isOpenNow: pseudoOpenNow,
        lat: ll.lat,
        lng: ll.lng,
        distanceKm: d,
        vibeScore: vibe,
        photoUrl: undefined,
        mapsUrl: mapsUrlFromLatLng(ll.lat, ll.lng, name),
        types: [tags["amenity"] || tags["shop"] || "food"].filter(Boolean)
      });
    }

    let filtered = items;
    if (body.openNow) filtered = filtered.filter((x) => x.isOpenNow === true);

    filtered.sort((a, b) => b.vibeScore - a.vibeScore);
    const top = filtered.slice(0, 5);

    return NextResponse.json({
      center: { lat, lng },
      results: top,
      meta: {
        provider: "OpenStreetMap/Overpass + Nominatim",
        note: "免費資料偶爾會限流或回空，已做防呆處理"
      }
    });
  } catch (e: any) {
    // ✅ 永遠回 JSON，前端就不會再 res.json() 爆
    return jsonError(e?.message ?? "Unknown error", 500);
  }
}

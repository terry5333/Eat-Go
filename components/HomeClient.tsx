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

const PRICE_TAGS: readonly PriceTag[] = ["便宜", "中等", "高級"] as const;

const FAV_KEY = "eatgo:favs:v1";
type Fav = Record<string, Restaurant>;

export default function HomeClient() {
  const [mode, setMode] = useState<"coords" | "text">("coords");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationText, setLocationText] = useState("");

  const [category, setCategory] = useState<FoodCategory>("不限");
  const [radiusKm, setRadiusKm] = useState<1 | 3 | 5>(3);
  const [openNow, setOpenNow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]

export type FoodCategory =
  | "不限"
  | "拉麵"
  | "火鍋"
  | "咖哩"
  | "牛排"
  | "早午餐"
  | "便當"
  | "燒肉"
  | "甜點"
  | "飲料";

export type PriceTag = "便宜" | "中等" | "高級";

export type SearchRequest = {
  mode: "coords" | "text";
  lat?: number;
  lng?: number;
  locationText?: string;

  radiusKm: 1 | 3 | 5;
  category: FoodCategory;

  openNow: boolean;

  // 免費版會忽略以下兩個，但保留型別相容（以後切回 Google 直接用）
  minRating: number;
  priceTags: PriceTag[];
};

export type Restaurant = {
  placeId: string;
  name: string;

  // 免費版多半沒有：
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number; // 0~4

  address?: string;

  // 免費版是「近似」：
  isOpenNow?: boolean;

  lat: number;
  lng: number;

  distanceKm: number;
  vibeScore: number;

  photoUrl?: string;
  mapsUrl: string;
  types?: string[];
};

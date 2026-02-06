export function vibeScore(params: {
  rating?: number;
  openNow?: boolean;
  distanceKm: number;
  priceLevel?: number;
}) {
  const rating = params.rating ?? 0;
  const open = params.openNow ? 1 : 0;
  const distancePenalty = params.distanceKm * 0.2;
  const price = params.priceLevel ?? 2;
  const priceBonus = 0.15 * (2 - Math.abs(price - 2));
  return rating * 2 + open + priceBonus - distancePenalty;
}

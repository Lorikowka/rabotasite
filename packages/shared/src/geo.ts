/**
 * Гео-утилиты: расстояние по прямой, форматирование координат и денег.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Пешеходная дистанция ≈ 1,4 × расстояние по прямой. */
export function walkingKm(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineKm(a, b) * 1.4 * 10) / 10;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPayment(
  amount: number,
  paymentType: 'per_hour' | 'per_month' | 'fixed_task',
): string {
  switch (paymentType) {
    case 'per_hour':
      return `${formatMoney(amount)}/час`;
    case 'per_month':
      return `${formatMoney(amount)}/мес`;
    case 'fixed_task':
      return formatMoney(amount);
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
}

/** «14–18» и т.п. */
export function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

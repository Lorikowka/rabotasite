/**
 * Категории объявлений и ограничения по возрасту / месту выполнения.
 */

export interface ListingCategory {
  id: string;
  title: string;
  /** Минимальный возраст, с которого категория разрешена. null — без ограничения. */
  minAllowedAge: number | null;
  /** Причина ограничения (показывается работодателю). */
  restrictionReason?: string;
  /** Категория подразумевает офлайн-работу в частном помещении (квартира, дом). */
  privateHomeRisk?: boolean;
  /** Разрешена ли частным заказчикам (физлицам). */
  allowedForIndividuals: boolean;
  /** Требуется старший сменщик на смене (касса, наличные, техника). */
  requiresSupervisor?: boolean;
}

export const LISTING_CATEGORIES: ListingCategory[] = [
  {
    id: 'cafe',
    title: 'Кафе, кофейня, ресторан',
    minAllowedAge: 14,
    allowedForIndividuals: false,
    requiresSupervisor: true,
  },
  {
    id: 'retail',
    title: 'Магазин, супермаркет, ПВЗ',
    minAllowedAge: 14,
    allowedForIndividuals: false,
    requiresSupervisor: true,
  },
  {
    id: 'promo',
    title: 'Промоутер, расклейка, раздача листовок',
    minAllowedAge: 14,
    allowedForIndividuals: true,
  },
  {
    id: 'delivery',
    title: 'Курьер, доставка',
    minAllowedAge: 16,
    restrictionReason: 'Доставка пешком на дальние расстояния разрешена с 16 лет',
    allowedForIndividuals: false,
  },
  {
    id: 'office',
    title: 'Офис, помощник, мероприятия',
    minAllowedAge: 14,
    allowedForIndividuals: false,
  },
  {
    id: 'it',
    title: 'IT, дизайн, монтаж, SMM',
    minAllowedAge: 14,
    allowedForIndividuals: true,
  },
  {
    id: 'tutor',
    title: 'Репетиторство, помощь с уроками',
    minAllowedAge: 14,
    privateHomeRisk: true,
    allowedForIndividuals: true,
  },
  {
    id: 'pets',
    title: 'Выгул собак, помощь по хозяйству',
    minAllowedAge: 14,
    privateHomeRisk: true,
    allowedForIndividuals: true,
  },
  {
    id: 'household',
    title: 'Бытовая помощь, уборка',
    minAllowedAge: 16,
    restrictionReason: 'Работа с бытовой техникой и химией разрешена с 16 лет',
    privateHomeRisk: true,
    allowedForIndividuals: true,
  },
  {
    id: 'events',
    title: 'Праздники, аниматор, охрана порядка',
    minAllowedAge: 14,
    allowedForIndividuals: true,
  },
  {
    id: 'warehouse',
    title: 'Склад, комплектовщик',
    minAllowedAge: 16,
    restrictionReason: 'Работы с подъёмными механизмами запрещены до 18 лет',
    allowedForIndividuals: false,
  },
  {
    id: 'production',
    title: 'Производство, цех',
    minAllowedAge: 18,
    restrictionReason: 'Вредные и опасные условия труда запрещены для несовершеннолетних',
    allowedForIndividuals: false,
  },
  {
    id: 'construction',
    title: 'Строительство, стройка',
    minAllowedAge: 18,
    restrictionReason: 'Подъёмные, опасные и строительные работы запрещены для несовершеннолетних',
    allowedForIndividuals: false,
  },
];

export const CATEGORY_IDS = LISTING_CATEGORIES.map((c) => c.id);

export function getCategory(id: string): ListingCategory | undefined {
  return LISTING_CATEGORIES.find((c) => c.id === id);
}

/** Места выполнения задания. */
export const LOCATION_TYPES = ['online', 'public_place', 'workplace', 'private_place'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  online: 'Онлайн',
  public_place: 'Общественное место',
  workplace: 'Рабочее место (адрес работодателя)',
  private_place: 'Частное помещение',
};

/**
 * Признаки частного жилого помещения в тексте адреса.
 * Используется как эвристика для блокировки офлайн-заданий у физлиц.
 */
export const PRIVATE_ADDRESS_MARKERS = [
  'квартир',
  'кв.',
  'частн',
  'дома',
  'д.',
  'подъезд',
  'жилой',
  'жилье',
  'жильё',
  'коттедж',
  'дач',
  'посёлок',
  'поселок',
  'комнат',
  'комнату',
  'своей квартире',
  'у меня дома',
];

export function looksLikePrivateAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return PRIVATE_ADDRESS_MARKERS.some((marker) => normalized.includes(marker));
}

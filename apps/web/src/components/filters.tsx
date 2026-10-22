'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LISTING_CATEGORIES } from '@teenwork/shared';

export interface FilterValues {
  q?: string;
  categoryId?: string;
  format?: string;
  paymentType?: string;
  minAge?: string;
  radiusKm?: string;
  sort?: string;
}

const SORT_OPTIONS = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'payment_desc', label: 'По убыванию оплаты' },
  { value: 'payment_asc', label: 'По возрастанию оплаты' },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'Любой формат' },
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Любая оплата' },
  { value: 'per_hour', label: 'Почасовая' },
  { value: 'per_month', label: 'Помесячная' },
  { value: 'fixed_task', label: 'За задание' },
];

const AGE_OPTIONS = [
  { value: '', label: 'Любой возраст' },
  { value: '14', label: 'С 14 лет' },
  { value: '16', label: 'С 16 лет' },
  { value: '18', label: 'С 18 лет' },
];

const RADIUS_OPTIONS = [
  { value: '', label: 'Любая удалённость' },
  { value: '1', label: 'До 1 км' },
  { value: '3', label: 'До 3 км' },
  { value: '5', label: 'До 5 км' },
  { value: '10', label: 'До 10 км' },
];

export function Filters({
  basePath,
  values,
}: {
  basePath: string;
  values: FilterValues;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(values.q ?? '');
  const [categoryId, setCategoryId] = useState(values.categoryId ?? '');
  const [format, setFormat] = useState(values.format ?? '');
  const [paymentType, setPaymentType] = useState(values.paymentType ?? '');
  const [minAge, setMinAge] = useState(values.minAge ?? '');
  const [radiusKm, setRadiusKm] = useState(values.radiusKm ?? '');
  const [sort, setSort] = useState(values.sort ?? 'new');

  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Геолокация недоступна в этом браузере');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);
        setCoords({ lat, lng });
        push({ lat, lng, radiusKm: radiusKm || '3' });
      },
      () => setGeoError('Не удалось определить местоположение'),
      { timeout: 8000 },
    );
  };

  const push = (patch: Partial<FilterValues> & { lat?: string; lng?: string }) => {
    const merged: FilterValues & { lat?: string; lng?: string } = {
      q: query,
      categoryId,
      format,
      paymentType,
      minAge,
      radiusKm,
      sort,
      lat: coords?.lat,
      lng: coords?.lng,
      ...patch,
    };

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }

    const search = params.toString();
    router.push(search ? `${basePath}?${search}` : basePath);
  };

  const selectClass =
    'w-full rounded-xl border border-brand-100 bg-surface px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400';

  return (
    <section className="mb-4 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-brand-100">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          push({});
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск: курьер, кофейня, SMM…"
          aria-label="Поиск по объявлениям"
          className="flex-1 rounded-xl border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Найти
        </button>
      </form>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            push({ categoryId: event.target.value });
          }}
          aria-label="Категория"
          className={selectClass}
        >
          <option value="">Все категории</option>
          {LISTING_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>

        <select
          value={paymentType}
          onChange={(event) => {
            setPaymentType(event.target.value);
            push({ paymentType: event.target.value });
          }}
          aria-label="Тип оплаты"
          className={selectClass}
        >
          {PAYMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={format}
          onChange={(event) => {
            setFormat(event.target.value);
            push({ format: event.target.value });
          }}
          aria-label="Формат работы"
          className={selectClass}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={minAge}
          onChange={(event) => {
            setMinAge(event.target.value);
            push({ minAge: event.target.value });
          }}
          aria-label="Минимальный возраст"
          className={selectClass}
        >
          {AGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={radiusKm}
          onChange={(event) => {
            setRadiusKm(event.target.value);
            push({ radiusKm: event.target.value });
          }}
          aria-label="Радиус поиска"
          className={selectClass}
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            push({ sort: event.target.value });
          }}
          aria-label="Сортировка"
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <button
          type="button"
          onClick={locate}
          className="rounded-full border border-brand-200 px-3 py-1.5 font-medium text-brand-700 transition hover:bg-brand-50"
        >
          📍 Найти рядом со мной
        </button>
        {coords && <span>Координаты получены — фильтр по расстоянию включён</span>}
        {geoError && <span className="text-rose-500">{geoError}</span>}
      </div>
    </section>
  );
}

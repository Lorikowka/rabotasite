'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LISTING_CATEGORIES,
  MIN_AGE_OPTIONS,
  evaluateListing,
  summarizeReport,
  type EmployerContext,
  type ListingType,
  type LocationType,
  type PaymentType,
} from '@teenwork/shared';
import { ApiError, clientApi } from '@/lib/api';

const TYPE_LABELS: { value: ListingType; label: string; hint: string }[] = [
  { value: 'vacancy', label: 'Вакансия', hint: 'Постоянная подработка: кафе, магазин, офис' },
  { value: 'gig', label: 'Быстрое задание', hint: 'Разовая помощь: листовки, уборка, монтаж' },
];

const PAYMENT_LABELS: { value: PaymentType; label: string }[] = [
  { value: 'per_hour', label: 'Почасовая' },
  { value: 'per_month', label: 'Помесячная' },
  { value: 'fixed_task', label: 'За задание' },
];

const LOCATION_LABELS: { value: LocationType; label: string }[] = [
  { value: 'workplace', label: 'Рабочее место (адрес компании)' },
  { value: 'public_place', label: 'Общественное место' },
  { value: 'private_place', label: 'Частное помещение' },
  { value: 'online', label: 'Онлайн' },
];

const SEVERITY_STYLE: Record<string, string> = {
  block: 'bg-rose-50 text-rose-700 border-rose-200',
  review: 'bg-accent-100 text-accent-500 border-accent-300',
  warn: 'bg-brand-50 text-brand-700 border-brand-200',
};

export function CreateListingForm({ employer }: { employer: EmployerContext }) {
  const router = useRouter();

  const [type, setType] = useState<ListingType>('gig');
  const [categoryId, setCategoryId] = useState('promo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minAge, setMinAge] = useState(14);
  const [format, setFormat] = useState<'online' | 'offline'>('offline');
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [paymentType, setPaymentType] = useState<PaymentType>('fixed_task');
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(3);
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [worksDuringStudyTime, setWorksDuringStudyTime] = useState(false);
  const [locationType, setLocationType] = useState<LocationType>('public_place');
  const [locationAddress, setLocationAddress] = useState('');
  const [hasSeniorSupervisor, setHasSeniorSupervisor] = useState(false);
  const [handlesCash, setHandlesCash] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; summary: string; moderation: boolean } | null>(null);

  const report = useMemo(
    () =>
      evaluateListing(
        {
          type,
          categoryId,
          title: title || 'Черновик объявления',
          description: description || 'Черновик описания объявления',
          minAge,
          format,
          paymentAmount,
          paymentType,
          maxHoursPerDay,
          shiftStart: shiftStart || null,
          shiftEnd: shiftEnd || null,
          worksDuringStudyTime,
          locationType,
          locationAddress: locationAddress || null,
          hasSeniorSupervisor,
          handlesCash,
        },
        employer,
      ),
    [
      type,
      categoryId,
      title,
      description,
      minAge,
      format,
      paymentAmount,
      paymentType,
      maxHoursPerDay,
      shiftStart,
      shiftEnd,
      worksDuringStudyTime,
      locationType,
      locationAddress,
      hasSeniorSupervisor,
      handlesCash,
      employer,
    ],
  );

  const inputClass =
    'w-full rounded-xl border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await clientApi<{
        listing: { id: string; status: string };
        complianceSummary: string;
      }>('/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          type,
          categoryId,
          title,
          description,
          minAge,
          format,
          paymentAmount,
          paymentType,
          maxHoursPerDay,
          shiftStart: shiftStart || null,
          shiftEnd: shiftEnd || null,
          worksDuringStudyTime,
          locationType,
          locationAddress: locationAddress || null,
          hasSeniorSupervisor,
          handlesCash,
        }),
      });

      setDone({
        id: result.listing.id,
        summary: result.complianceSummary,
        moderation: result.listing.status === 'moderation',
      });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.details as { violations?: { message: string }[] } | undefined;
        setError(
          details?.violations?.length
            ? `${err.message}: ${details.violations.map((v) => v.message).join('; ')}`
            : err.message,
        );
      } else {
        setError('Не удалось создать объявление');
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-3 rounded-2xl bg-surface p-6 text-center shadow-sm ring-1 ring-brand-100">
        <p className="text-3xl">{done.moderation ? '🕒' : '🎉'}</p>
        <h2 className="text-base font-bold text-ink-900">
          {done.moderation ? 'Объявление отправлено на модерацию' : 'Объявление опубликовано'}
        </h2>
        <p className="text-xs text-ink-600">{done.summary}</p>
        <p className="text-xs text-ink-500">
          {done.moderation
            ? 'Обычно проверка занимает до 30 минут. Пока объявление не видно в ленте.'
            : 'Объявление уже видно в ленте. Отклики придут в раздел «Мои отклики».'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <a
            href={`/listings/${done.id}`}
            className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white"
          >
            Открыть карточку
          </a>
          <a
            href="/applications"
            className="rounded-full bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700"
          >
            Мои отклики
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Тип объявления</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TYPE_LABELS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={`rounded-xl border p-3 text-left transition ${
                type === option.value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-brand-100 hover:border-brand-200'
              }`}
            >
              <span className="block text-sm font-bold text-ink-900">{option.label}</span>
              <span className="block text-[11px] text-ink-500">{option.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Описание задачи</h2>

        <div>
          <label htmlFor="category" className="mb-1 block text-xs font-semibold text-ink-600">
            Категория
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={inputClass}
          >
            {LISTING_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
                {category.minAllowedAge ? ` (с ${category.minAllowedAge} лет)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-xs font-semibold text-ink-600">
            Заголовок
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Раздать листовки у метро"
            maxLength={120}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-xs font-semibold text-ink-600">
            Подробное описание
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={3000}
            placeholder="Что нужно делать, сколько времени, что предоставим, как оплачиваем"
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minAge" className="mb-1 block text-xs font-semibold text-ink-600">
              Минимальный возраст
            </label>
            <select
              id="minAge"
              value={minAge}
              onChange={(event) => setMinAge(Number(event.target.value))}
              className={inputClass}
            >
              {MIN_AGE_OPTIONS.map((age) => (
                <option key={age} value={age}>
                  С {age} лет
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="format" className="mb-1 block text-xs font-semibold text-ink-600">
              Формат
            </label>
            <select
              id="format"
              value={format}
              onChange={(event) => setFormat(event.target.value as 'online' | 'offline')}
              className={inputClass}
            >
              <option value="offline">Офлайн</option>
              <option value="online">Онлайн</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Оплата и график</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="paymentAmount" className="mb-1 block text-xs font-semibold text-ink-600">
              Сумма, ₽
            </label>
            <input
              id="paymentAmount"
              type="number"
              min={1}
              step={10}
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(Number(event.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="paymentType" className="mb-1 block text-xs font-semibold text-ink-600">
              Тип оплаты
            </label>
            <select
              id="paymentType"
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value as PaymentType)}
              className={inputClass}
            >
              {PAYMENT_LABELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="hours" className="mb-1 block text-xs font-semibold text-ink-600">
              Часов в день
            </label>
            <input
              id="hours"
              type="number"
              min={1}
              max={8}
              value={maxHoursPerDay}
              onChange={(event) => setMaxHoursPerDay(Number(event.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="shiftStart" className="mb-1 block text-xs font-semibold text-ink-600">
              Начало
            </label>
            <input
              id="shiftStart"
              type="time"
              value={shiftStart}
              onChange={(event) => setShiftStart(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="shiftEnd" className="mb-1 block text-xs font-semibold text-ink-600">
              Окончание
            </label>
            <input
              id="shiftEnd"
              type="time"
              value={shiftEnd}
              onChange={(event) => setShiftEnd(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={worksDuringStudyTime}
            onChange={(event) => setWorksDuringStudyTime(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-brand-200"
          />
          Задача выполняется в учебное время (нужно разрешение школы)
        </label>
      </section>

      <section className="space-y-3 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Место и безопасность</h2>

        <div>
          <label htmlFor="locationType" className="mb-1 block text-xs font-semibold text-ink-600">
            Тип места
          </label>
          <select
            id="locationType"
            value={locationType}
            onChange={(event) => setLocationType(event.target.value as LocationType)}
            className={inputClass}
          >
            {LOCATION_LABELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-xs font-semibold text-ink-600">
            Адрес или ориентир
          </label>
          <input
            id="address"
            value={locationAddress}
            onChange={(event) => setLocationAddress(event.target.value)}
            placeholder="ул. Пушкина, 10, вход со двора"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-ink-500">
            Для офлайн-работы адрес обязателен. Частные адреса физлицам для офлайн-заданий не
            разрешены — используйте общественное место.
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={hasSeniorSupervisor}
            onChange={(event) => setHasSeniorSupervisor(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-brand-200"
          />
          На смене будет старший сотрудник
        </label>

        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={handlesCash}
            onChange={(event) => setHandlesCash(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-brand-200"
          />
          Подросток будет работать с наличными / кассой
        </label>
      </section>

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Проверка по ТК РФ</h2>
        <p className="mt-1 text-[11px] text-ink-500">
          Проверяем объявление в реальном времени — так вы увидите проблемы до публикации.
        </p>

        {report.violations.length === 0 ? (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            ✓ Нарушений не найдено — объявление можно публиковать.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.violations.map((violation) => (
              <li
                key={violation.code}
                className={`rounded-xl border p-3 text-xs leading-relaxed ${
                  SEVERITY_STYLE[violation.severity] ?? SEVERITY_STYLE.warn
                }`}
              >
                <p className="font-semibold">{violation.message}</p>
                {violation.hint && <p className="mt-1 opacity-90">{violation.hint}</p>}
              </li>
            ))}
          </ul>
        )}

        {Object.keys(report.suggestions).length > 0 && (
          <p className="mt-3 text-[11px] text-ink-500">
            Подсказки: {summarizeReport(report)}
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || report.blocked}
        className="w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Публикуем…'
          : report.blocked
            ? 'Объявление нельзя опубликовать — исправьте замечания'
            : 'Опубликовать объявление'}
      </button>
    </form>
  );
}

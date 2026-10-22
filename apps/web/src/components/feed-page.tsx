import Link from 'next/link';
import { listingQuerySchema, type ListingWithComplianceDTO } from '@teenwork/shared';
import { toQuery } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { Filters, type FilterValues } from './filters';
import { ListingCard } from './listing-card';

export type SearchParams = Record<string, string | string[] | undefined>;

function flatten(params: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined) result[key] = single;
  }
  return result;
}

export async function FeedPage({
  type,
  searchParams,
}: {
  type: 'vacancy' | 'gig';
  searchParams: SearchParams;
}) {
  const flat = flatten(searchParams);
  const parsed = listingQuerySchema.safeParse({ ...flat, type });
  const query = parsed.success ? parsed.data : listingQuerySchema.parse({ type });

  const { items } = await serverApi<{ items: ListingWithComplianceDTO[] }>(
    `/api/listings${toQuery({
      type: query.type,
      categoryId: query.categoryId,
      format: query.format,
      paymentType: query.paymentType,
      minAge: query.minAge,
      paymentFrom: query.paymentFrom,
      q: query.q,
      radiusKm: query.radiusKm,
      lat: query.lat,
      lng: query.lng,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    })}`,
  );

  const filterValues: FilterValues = {
    q: query.q,
    categoryId: query.categoryId,
    format: query.format,
    paymentType: query.paymentType,
    minAge: query.minAge ? String(query.minAge) : undefined,
    radiusKm: query.radiusKm ? String(query.radiusKm) : undefined,
    sort: query.sort,
  };

  const isGig = type === 'gig';

  return (
    <>
      <section className="theme-hero mb-6 overflow-hidden rounded-[2rem] p-7 text-white shadow-xl shadow-brand-900/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent-300">TeenWork / {isGig ? 'разовые задачи' : 'вакансии'}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              {isGig ? 'Быстрые задания' : 'Вакансии для подростков'}
            </h1>
            <p className="theme-hero-muted mt-3 max-w-xl text-sm leading-relaxed">
              {isGig
                ? 'Разовые задания рядом с домом: помощь, промо, мелкий ремонт. Безопасные условия, оплата сразу.'
                : 'Проверенные подработки в сфере услуг. Соответствуют ТК РФ, с проверкой работодателей и защитой от мошенников.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">Проверка по ТК РФ</span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">Согласие родителей</span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">Чат внутри платформы</span>
          </div>
        </div>
      </section>

      <Filters basePath={isGig ? '/gigs' : '/'} values={filterValues} />

      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-brand-100">
          <p className="text-3xl">🔍</p>
          <h2 className="mt-2 text-base font-bold text-ink-900">Ничего не нашлось</h2>
          <p className="mt-1 text-sm text-ink-600">
            Попробуйте изменить фильтры или загляните в другую ленту.
          </p>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            <Link
              href={isGig ? '/' : '/gigs'}
              className="rounded-full bg-brand-50 px-4 py-2 font-semibold text-brand-700"
            >
              {isGig ? 'Смотреть вакансии' : 'Смотреть быстрые задания'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}

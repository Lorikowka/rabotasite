import Link from 'next/link';
import { listingQuerySchema, type ListingWithComplianceDTO } from '@teenwork/shared';
import { toQuery } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { Filters, type FilterValues } from './filters';
import { ListingCard } from './listing-card';
import { getSession } from '@/lib/session';
import { Icon } from './icons';

export type SearchParams = Record<string, string | string[] | undefined>;

function flatten(params: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined) result[key] = single;
  }
  return result;
}

export async function FeedPage({ type, searchParams }: { type: 'vacancy' | 'gig'; searchParams: SearchParams }) {
  const flat = flatten(searchParams);
  const parsed = listingQuerySchema.safeParse({ ...flat, type });
  const query = parsed.success ? parsed.data : listingQuerySchema.parse({ type });
  const { items } = await serverApi<{ items: ListingWithComplianceDTO[] }>(`/api/listings${toQuery({ type: query.type, categoryId: query.categoryId, format: query.format, paymentType: query.paymentType, minAge: query.minAge, paymentFrom: query.paymentFrom, q: query.q, radiusKm: query.radiusKm, lat: query.lat, lng: query.lng, sort: query.sort, limit: query.limit, offset: query.offset })}`);
  const session = await getSession();
  const filterValues: FilterValues = { q: query.q, categoryId: query.categoryId, format: query.format, paymentType: query.paymentType, minAge: query.minAge ? String(query.minAge) : undefined, radiusKm: query.radiusKm ? String(query.radiusKm) : undefined, sort: query.sort };
  const isGig = type === 'gig';
  const age = session?.teenProfile?.age ?? null;

  return (
    <div className="space-y-5">
      <section className="theme-hero relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full bg-accent-300/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-accent-300">
            <Icon name="shield" size={14} /> Все заказчики проходят проверку
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {isGig ? 'Быстрые задания рядом с тобой' : 'Проверенные вакансии для подростков'}
          </h1>
          <p className="theme-hero-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            {isGig ? 'Разовые поручения на несколько часов: помощь по дому, промо, дизайн и другие безопасные задания.' : 'Подработка с понятными условиями, проверкой работодателя и соблюдением норм ТК РФ.'}
          </p>
        </div>
        <div className="relative z-10 mt-7 flex flex-wrap gap-2 text-xs font-medium">
          <span className="theme-hero-chip rounded-full px-3 py-1.5">Проверка работодателя</span>
          <span className="theme-hero-chip rounded-full px-3 py-1.5">Защита в чате</span>
          <span className="theme-hero-chip rounded-full px-3 py-1.5">Возрастные ограничения</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-500">Витрина TeenWork</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-brand-900">{isGig ? 'Найди задачу на сегодня' : 'Выбери подходящую вакансию'}</h2>
        </div>
        {age && <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Тебе доступно: {age} лет</span>}
      </div>

      <Filters basePath={isGig ? '/gigs' : '/'} values={filterValues} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-surface p-10 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon name="search" size={26} /></div>
          <h2 className="mt-3 text-base font-bold text-ink-900">Ничего не нашлось</h2>
          <p className="mt-1 text-sm text-ink-600">Попробуйте изменить фильтры или загляните в другую ленту.</p>
          <Link href={isGig ? '/' : '/gigs'} className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">{isGig ? 'Открыть вакансии' : 'Открыть быстрые задания'}</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import type { ListingDTO } from '@teenwork/shared';
import { formatDistance, formatPayment } from '@teenwork/shared';
import { Icon } from './icons';

export function ListingCard({ listing }: { listing: ListingDTO }) {
  const employer = listing.employer;
  const employerName = employer.companyName ?? employer.fullName;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
            {listing.categoryTitle}
          </span>
          <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-ink-900">
            <Link href={`/listings/${listing.id}`} className="transition hover:text-brand-600">
              {listing.title}
            </Link>
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black text-brand-600">
            {formatPayment(listing.paymentAmount, listing.paymentType)}
          </div>
          <div className="text-[11px] text-ink-500">
            {listing.paymentType === 'per_hour' ? 'в час' : listing.paymentType === 'per_month' ? 'в месяц' : 'за задачу'}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-600">{listing.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium">
        {listing.minAge > 14 && <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">с {listing.minAge} лет</span>}
        <span className="theme-subtle-surface rounded-md px-2 py-1 text-ink-600">{listing.format === 'online' ? 'Онлайн' : 'Офлайн'}</span>
        <span className="theme-subtle-surface rounded-md px-2 py-1 text-ink-600">до {listing.maxHoursPerDay} ч/день</span>
        {listing.distanceKm !== null && <span className="theme-subtle-surface rounded-md px-2 py-1 text-ink-600">{formatDistance(listing.distanceKm)}</span>}
        {listing.worksDuringStudyTime && <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">в учебное время</span>}
      </div>

      <footer className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-black text-brand-700">{(employerName.slice(0, 1) || '?').toUpperCase()}</div>
        <span className="min-w-0 truncate text-xs font-semibold text-ink-700">{employerName}</span>
        {employer.isVerified && <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"><Icon name="shield" size={12} /> Проверен</span>}
        {employer.ratingCount > 0 && <span className="shrink-0 text-xs font-bold text-amber-500">★ {employer.rating.toFixed(1)}</span>}
      </footer>
    </article>
  );
}

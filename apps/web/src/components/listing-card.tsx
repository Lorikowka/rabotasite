import Link from 'next/link';
import type { ListingDTO } from '@teenwork/shared';
import { formatDistance, formatPayment } from '@teenwork/shared';

export function ListingCard({ listing }: { listing: ListingDTO }) {
  const employer = listing.employer;
  const employerName = employer.companyName ?? employer.fullName;

  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-bold text-brand-900">
            {listing.categoryTitle}
          </span>
          <h3 className="mt-3 text-lg font-black leading-snug text-brand-900">
            <Link href={`/listings/${listing.id}`} className="hover:text-brand-700">
              {listing.title}
            </Link>
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-black text-brand-700">
            {formatPayment(listing.paymentAmount, listing.paymentType)}
          </div>
          <div className="text-[11px] text-ink-500">
            {listing.paymentType === 'per_hour'
              ? 'в час'
              : listing.paymentType === 'per_month'
                ? 'в месяц'
                : 'за задание'}
          </div>
        </div>
      </div>

      <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-600">
        {listing.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        {listing.minAge > 14 && (
          <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700">
            с {listing.minAge} лет
          </span>
        )}
        <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-ink-600">
          {listing.format === 'online' ? 'Онлайн' : 'Офлайн'}
        </span>
        <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-ink-600">
          до {listing.maxHoursPerDay} ч/день
        </span>
        {listing.shiftStart && listing.shiftEnd && (
          <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-ink-600">
            {listing.shiftStart}–{listing.shiftEnd}
          </span>
        )}
        {listing.distanceKm !== null && (
          <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-ink-600">
            {formatDistance(listing.distanceKm)}
          </span>
        )}
        {listing.worksDuringStudyTime && (
          <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-brand-700">в учебное время</span>
        )}
      </div>

      <footer className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[12px] text-ink-600">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
          {(employerName.slice(0, 1) || '?').toUpperCase()}
        </div>
        <span className="truncate font-medium text-ink-700">{employerName}</span>
        {employer.isVerified ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            Проверен
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-ink-500">
            {employer.isBusiness ? 'На проверке' : 'Физлицо'}
          </span>
        )}
        {employer.ratingCount > 0 && (
          <span className="ml-auto text-amber-500">
            ★ {employer.rating.toFixed(1)} <span className="text-ink-400">({employer.ratingCount})</span>
          </span>
        )}
      </footer>
    </article>
  );
}

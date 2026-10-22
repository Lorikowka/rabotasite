import Link from 'next/link';
import type { ListingDTO } from '@teenwork/shared';
import { formatDistance, formatPayment } from '@teenwork/shared';

export function ListingCard({ listing }: { listing: ListingDTO }) {
  const employer = listing.employer;
  const employerName = employer.companyName ?? employer.fullName;

  return (
    <article className="group rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-brand-100 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {listing.categoryTitle}
          </span>
          <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-ink-900">
            <Link href={`/listings/${listing.id}`} className="hover:text-brand-700">
              {listing.title}
            </Link>
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-base font-extrabold text-brand-700">
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

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-600">
        {listing.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        {listing.minAge > 14 && (
          <span className="rounded-md bg-accent-100 px-2 py-0.5 text-accent-500">
            с {listing.minAge} лет
          </span>
        )}
        <span className="rounded-md bg-canvas px-2 py-0.5 text-ink-600">
          {listing.format === 'online' ? 'Онлайн' : 'Офлайн'}
        </span>
        <span className="rounded-md bg-canvas px-2 py-0.5 text-ink-600">
          до {listing.maxHoursPerDay} ч/день
        </span>
        {listing.shiftStart && listing.shiftEnd && (
          <span className="rounded-md bg-canvas px-2 py-0.5 text-ink-600">
            {listing.shiftStart}–{listing.shiftEnd}
          </span>
        )}
        {listing.distanceKm !== null && (
          <span className="rounded-md bg-canvas px-2 py-0.5 text-ink-600">
            {formatDistance(listing.distanceKm)}
          </span>
        )}
        {listing.worksDuringStudyTime && (
          <span className="rounded-md bg-brand-100 px-2 py-0.5 text-brand-700">в учебное время</span>
        )}
      </div>

      <footer className="mt-3 flex items-center gap-2 border-t border-brand-50 pt-3 text-[12px] text-ink-600">
        <span className="font-semibold text-ink-700">{employerName}</span>
        {employer.isVerified ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            ✓ проверен
          </span>
        ) : (
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-500">
            {employer.isBusiness ? 'ИНН на проверке' : 'физлицо'}
          </span>
        )}
        {employer.ratingCount > 0 && (
          <span className="ml-auto text-accent-500">
            ★ {employer.rating.toFixed(1)} <span className="text-ink-400">({employer.ratingCount})</span>
          </span>
        )}
      </footer>
    </article>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ListingWithComplianceDTO } from '@teenwork/shared';
import { formatDistance, formatPayment } from '@teenwork/shared';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';
import { ApplyButton } from '@/components/apply-button';
import { ReportButton } from '@/components/report-button';

async function fetchListing(id: string): Promise<ListingWithComplianceDTO | null> {
  try {
    return await serverApi<ListingWithComplianceDTO>(`/api/listings/${id}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: 'Объявление не найдено' };
  }

  const payment = formatPayment(listing.paymentAmount, listing.paymentType);

  return {
    title: `${listing.title} — ${listing.categoryTitle}`,
    description: `${listing.title} в ${listing.categoryTitle}: ${payment}, до ${listing.maxHoursPerDay} ч в день. ${
      listing.minAge > 14 ? `От ${listing.minAge} лет. ` : ''
    }Работа для подростков на TeenWork.`,
    openGraph: {
      title: listing.title,
      description: `${listing.categoryTitle} · ${payment}`,
      type: 'website',
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, session] = await Promise.all([fetchListing(id), getSession()]);

  if (!listing) notFound();

  const employer = listing.employer;
  const employerName = employer.companyName ?? employer.fullName;
  const isOwner = session?.user.id === employer.id;

  return (
    <div className="space-y-4">
      <Link
        href={listing.type === 'gig' ? '/gigs' : '/'}
        className="inline-flex text-xs font-medium text-ink-500 hover:text-brand-700"
      >
        ← Назад к ленте
      </Link>

      <article className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
            {listing.categoryTitle}
          </span>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-600">
            {listing.type === 'gig' ? 'Быстрое задание' : 'Вакансия'}
          </span>
          {listing.minAge > 14 && (
            <span className="rounded-full bg-accent-100 px-2.5 py-1 text-accent-500">
              с {listing.minAge} лет
            </span>
          )}
        </div>

        <h1 className="mt-3 text-xl font-extrabold leading-tight text-ink-900">
          {listing.title}
        </h1>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-brand-700">
            {formatPayment(listing.paymentAmount, listing.paymentType)}
          </span>
          <span className="text-xs text-ink-500">
            {listing.paymentType === 'per_hour'
              ? 'в час'
              : listing.paymentType === 'per_month'
                ? 'в месяц'
                : 'за задание'}
          </span>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          {listing.description}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-ink-500">Формат</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">
              {listing.format === 'online' ? 'Онлайн' : 'Офлайн'}
            </dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-ink-500">Нагрузка</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">
              до {listing.maxHoursPerDay} ч/день
            </dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-ink-500">Смена</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">
              {listing.shiftStart && listing.shiftEnd
                ? `${listing.shiftStart}–${listing.shiftEnd}`
                : 'по договорённости'}
            </dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-ink-500">Место</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">
              {listing.locationAddress ?? 'уточняется'}
              {listing.distanceKm !== null && (
                <span className="ml-1 font-normal text-ink-500">
                  ({formatDistance(listing.distanceKm)})
                </span>
              )}
            </dd>
          </div>
        </dl>

        {listing.worksDuringStudyTime && (
          <p className="mt-3 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
            Работа в удобное время — можно совмещать со школой.
          </p>
        )}
      </article>

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Заказчик</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {employerName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-800">{employerName}</p>
            <p className="text-xs text-ink-500">
              {employer.isBusiness ? 'Компания' : 'Частный заказчик'}
              {employer.ratingCount > 0 && ` · ★ ${employer.rating.toFixed(1)} (${employer.ratingCount})`}
            </p>
          </div>
          {employer.isVerified ? (
            <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              ✓ проверен
            </span>
          ) : employer.isBusiness ? (
            <span className="ml-auto rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-500">
              ИНН на проверке
            </span>
          ) : null}
        </div>

        <p className="mt-3 rounded-xl bg-canvas p-3 text-[11px] leading-relaxed text-ink-600">
          Проверьте заказчика до начала работы: у бизнеса должен быть ИНН, у частного заказчика —
          встречайтесь в общественном месте. Подробности — в разделе «Документы».
        </p>

        <div className="mt-3">
          <ReportButton targetType="listing" targetId={listing.id} />
        </div>
      </section>

      {isOwner && listing.compliance.violations.length > 0 && (
        <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <h2 className="text-sm font-bold text-amber-900">Проверка объявления</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-amber-900/90">
            {listing.compliance.violations.map((violation) => (
              <li key={violation.code}>
                <span className="font-semibold">{violation.message}</span>
                {violation.hint ? ` ${violation.hint}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-sm font-bold text-ink-900">Откликнуться</h2>
        <p className="mb-3 mt-1 text-xs text-ink-600">
          Заказчик увидит ваш профиль, рейтинг и бейджи. Контакты скрыты — общайтесь в чате.
        </p>
        <ApplyButton
          listing={listing}
          isLoggedIn={Boolean(session)}
          role={session?.user.role ?? null}
        />
      </section>

      <section className="rounded-2xl bg-brand-50 p-5">
        <h2 className="text-sm font-bold text-brand-800">Как не попасться мошенникам</h2>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-brand-900/80">
          <li>• Никогда не переводите деньги «за оборудование» и не отправляйте фото документов.</li>
          <li>• Легальный работодатель оформляет согласие родителей и договор.</li>
          <li>• Переписка только внутри платформы — так вы под защитой.</li>
        </ul>
        <Link
          href="/documents"
          className="mt-3 inline-block text-xs font-bold text-brand-700 underline"
        >
          Памятка «5 красных флагов»
        </Link>
      </section>
    </div>
  );
}

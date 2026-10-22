import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ApplicationDTO, ReviewDTO } from '@teenwork/shared';
import { formatPayment, formatRelative } from '@teenwork/shared';
import { API_URL } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';
import { ApplicationActions } from '@/components/application-actions';
import { ReviewAction } from '@/components/review-action';

export const metadata: Metadata = {
  title: 'Мои отклики',
  description: 'Отклики на вакансии и быстрые задания: статусы, чат и документы.',
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ждём ответа', className: 'bg-accent-100 text-accent-500' },
  accepted: { label: 'Принято', className: 'bg-emerald-50 text-emerald-600' },
  completed: { label: 'Выполнено', className: 'bg-brand-50 text-brand-700' },
  rejected: { label: 'Отклонено', className: 'bg-rose-50 text-rose-500' },
  cancelled: { label: 'Отменено', className: 'bg-canvas text-ink-500' },
};

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { items } = await serverApi<{ items: ApplicationDTO[] }>('/api/applications');
  const isEmployer = session.user.role !== 'teen';

  const counterpartIds = Array.from(
    new Set(
      items.map((application) =>
        isEmployer ? application.teen.id : application.employer.id,
      ),
    ),
  );

  const counterpartReviews = await Promise.all(
    counterpartIds.map(async (id) => {
      const response = await serverApi<{ items: ReviewDTO[] }>(
        `/api/users/${id}/reviews`,
      ).catch(() => ({ items: [] }));
      return [id, response.items] as const;
    }),
  );

  // Отзыв можно оставить только один раз по каждому отклику.
  // В списке отзывов контрагента есть отзывы, оставленные в том числе нами,
  // поэтому отбираем только свои.
  const reviewedApplicationIds = new Set(
    counterpartReviews.flatMap(([, reviews]) =>
      reviews
        .filter((review) => review.from.id === session.user.id)
        .map((review) => review.applicationId),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">
            {isEmployer ? 'Отклики на мои объявления' : 'Мои отклики'}
          </h1>
          <p className="mt-1 text-xs text-ink-600">
            {isEmployer
              ? 'Здесь видно, кто хочет у вас работать. Контакты скрыты — переписка в чате.'
              : 'Статусы откликов и переписка с заказчиками.'}
          </p>
        </div>
        {isEmployer && (
          <Link
            href="/create"
            className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white"
          >
            + Объявление
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-brand-100">
          <p className="text-3xl">📭</p>
          <h2 className="mt-2 text-base font-bold text-ink-900">Откликов пока нет</h2>
          <p className="mt-1 text-sm text-ink-600">
            {isEmployer
              ? 'Опубликуйте объявление — отклики появятся здесь.'
              : 'Загляните в ленту и откликнитесь на подходящую подработку.'}
          </p>
          <Link
            href={isEmployer ? '/create' : '/'}
            className="mt-4 inline-block rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
          >
            {isEmployer ? 'Создать объявление' : 'Открыть ленту'}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((application) => {
            const status = STATUS_STYLES[application.status] ?? {
              label: application.status,
              className: 'bg-canvas text-ink-600',
            };
            const counterpart = isEmployer
              ? application.teen.fullName
              : (application.employer.companyName ?? application.employer.fullName);

            return (
              <article
                key={application.id}
                className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-brand-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/listings/${application.listingId}`}
                      className="text-sm font-bold text-ink-900 hover:text-brand-700"
                    >
                      {application.listingTitle}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {isEmployer ? 'Соискатель' : 'Заказчик'}:{' '}
                      <span className="font-semibold text-ink-700">{counterpart}</span>
                      {isEmployer && application.teen.ageCohort && (
                        <span className="ml-1 text-ink-400">
                          ({application.teen.ageCohort === '14_15'
                            ? '14–15'
                            : application.teen.ageCohort === '16_17'
                              ? '16–17'
                              : '18'}{' '}
                          лет)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-brand-700">
                      {formatPayment(application.paymentAmount, application.paymentType)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                {application.message && (
                  <p className="mt-2 rounded-xl bg-canvas p-2.5 text-xs leading-relaxed text-ink-600">
                    «{application.message}»
                  </p>
                )}

                <p className="mt-2 text-[11px] text-ink-400">
                  Отклик {formatRelative(application.createdAt)}
                </p>

                <div className="mt-3">
                  <ApplicationActions
                    applicationId={application.id}
                    status={application.status}
                    role={session.user.role}
                    unreadMessages={application.unreadMessages}
                  />
                </div>

                {(application.status === 'accepted' || application.status === 'completed') && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-50 pt-3">
                    {!isEmployer && (
                      <a
                        href={`${API_URL}/api/documents/parent-consent?applicationId=${application.id}`}
                        className="rounded-xl bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700"
                      >
                        ⬇ Согласие родителей (PDF)
                      </a>
                    )}
                    {isEmployer && (
                      <a
                        href={`${API_URL}/api/documents/employment-contract?applicationId=${application.id}`}
                        className="rounded-xl bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700"
                      >
                        ⬇ Трудовой договор (PDF)
                      </a>
                    )}
                  </div>
                )}

                {(application.status === 'accepted' || application.status === 'completed') &&
                  !reviewedApplicationIds.has(application.id) && (
                    <div className="mt-2">
                      <ReviewAction applicationId={application.id} />
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

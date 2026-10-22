import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cohortRule } from '@teenwork/shared';
import type { ReviewDTO } from '@teenwork/shared';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';
import { BadgeList } from '@/components/badges';
import { ProfileEditor } from '@/components/profile-editor';
import { LogoutButton } from '@/components/logout-button';
import { ReviewList } from '@/components/review-list';

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Ваш профиль TeenWork: навыки, бейджи, рейтинг и документы.',
};

const ROLE_LABELS: Record<string, string> = {
  teen: 'Соискатель',
  business: 'Компания / ИП',
  individual: 'Частный заказчик',
  admin: 'Модератор',
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { user, teenProfile, employerProfile } = session;
  const cohort = teenProfile ? cohortRule(teenProfile.ageCohort) : null;

  const reviews = await serverApi<{ items: ReviewDTO[] }>(
    `/api/users/${user.id}/reviews`,
  ).catch(() => ({ items: [] }));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-base font-black text-brand-700">
            {user.fullName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-ink-900">{user.fullName}</h1>
            <p className="text-xs text-ink-500">
              {ROLE_LABELS[user.role] ?? user.role}
              {teenProfile ? ` · ${teenProfile.age} лет` : ''}
              {' · с '}
              {new Date(user.createdAt).toLocaleDateString('ru-RU')}
            </p>
            <p className="mt-1 text-xs text-ink-600">
              Рейтинг: <span className="font-bold text-accent-500">★ {user.rating.toFixed(1)}</span>{' '}
              ({user.ratingCount} отзывов)
            </p>
          </div>
        </div>

        {teenProfile && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-lg font-black text-brand-700">{teenProfile.completedGigs}</p>
                <p className="text-[11px] text-ink-500">заданий выполнено</p>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-lg font-black text-brand-700">{teenProfile.reviewsCount}</p>
                <p className="text-[11px] text-ink-500">отзывов</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-ink-600">Бейджи</p>
              <BadgeList badges={teenProfile.badges} />
            </div>

            {cohort && (
              <div className="mt-4 rounded-xl bg-brand-50 p-3 text-[11px] leading-relaxed text-brand-900/80">
                <p className="font-bold text-brand-800">Ваши ограничения по ТК РФ</p>
                <p className="mt-1">
                  Возрастная группа {cohort.label}: не более {cohort.maxHoursPerDay} ч в день и{' '}
                  {cohort.maxHoursPerWeek} ч в неделю.
                  {cohort.allowNightShift
                    ? ' Ночные смены допустимы — вам 18 лет.'
                    : ' Ночные смены (после 22:00) запрещены.'}
                </p>
                <p className="mt-1">
                  {cohort.requiresParentConsent &&
                    ' Для работы потребуется письменное согласие родителя.'}
                  {cohort.requiresSchoolPermit &&
                    ' Для работы в учебное время нужно разрешение школы.'}
                </p>
              </div>
            )}
          </>
        )}

        {employerProfile && (
          <div className="mt-4 rounded-xl bg-canvas p-3 text-xs text-ink-700">
            <p className="font-bold">Данные заказчика</p>
            <p className="mt-1">
              {employerProfile.companyName ?? 'Без компании (физлицо)'}
              {employerProfile.inn ? ` · ИНН ${employerProfile.inn}` : ''}
            </p>
            <p className="mt-1">
              Статус проверки:{' '}
              <span className="font-semibold">
                {employerProfile.verificationStatus === 'verified'
                  ? '✓ подтверждён'
                  : employerProfile.verificationStatus === 'pending'
                    ? 'ожидает модерации'
                    : employerProfile.verificationStatus === 'rejected'
                      ? 'отклонён'
                      : 'не требуется (физлицо)'}
              </span>
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/applications"
            className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700"
          >
            Мои отклики
          </Link>
          <Link
            href="/documents"
            className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700"
          >
            Документы
          </Link>
          {user.role !== 'teen' && (
            <Link
              href="/create"
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white"
            >
              Создать объявление
            </Link>
          )}
          <LogoutButton />
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="mb-4 text-sm font-bold text-ink-900">
          {user.role === 'teen' ? 'Профиль соискателя' : 'Профиль заказчика'}
        </h2>
        <ProfileEditor session={session} />
      </section>

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-900">Отзывы</h2>
          <span className="text-xs text-ink-500">
            ★ {user.rating.toFixed(1)} · {user.ratingCount}
          </span>
        </div>
        <ReviewList reviews={reviews.items} />
      </section>
    </div>
  );
}

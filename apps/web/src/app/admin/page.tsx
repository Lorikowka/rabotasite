import type { Metadata } from 'next';
import Link from 'next/link';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Панель модератора',
  description: 'Модерация объявлений, жалобы, подозрительные сообщения и пользователи.',
};

export default async function AdminPage() {
  const stats = await serverApi<{
    users: number;
    listings: number;
    moderation: number;
    applications: number;
    newReports: number;
    flaggedMessages: number;
  }>('/api/admin/stats').catch(() => ({
    users: 0,
    listings: 0,
    moderation: 0,
    applications: 0,
    newReports: 0,
    flaggedMessages: 0,
  }));

  const totalPending = stats.moderation + stats.newReports + stats.flaggedMessages;

  const cards = [
    {
      href: '/admin/moderation',
      title: 'На модерации',
      value: stats.moderation,
      desc: 'Объявления, требующие проверки',
      color: 'bg-amber-50 text-amber-700 ring-amber-200',
      icon: '⏳',
    },
    {
      href: '/admin/reports',
      title: 'Новые жалобы',
      value: stats.newReports,
      desc: 'Жалобы пользователей',
      color: 'bg-rose-50 text-rose-700 ring-rose-200',
      icon: '🚨',
    },
    {
      href: '/admin/flagged',
      title: 'Подозрительные сообщения',
      value: stats.flaggedMessages,
      desc: 'С авто-антифродом',
      color: 'bg-orange-50 text-orange-700 ring-orange-200',
      icon: '⚠️',
    },
    {
      href: '/admin/users',
      title: 'Пользователи',
      value: stats.users,
      desc: 'Поиск и просмотр',
      color: 'bg-blue-50 text-blue-700 ring-blue-200',
      icon: '👥',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Панель модератора</h1>
            <p className="mt-1 text-sm text-slate-300">
              {totalPending > 0
                ? `Требуют внимания: ${totalPending}`
                : 'Очередь чистая. Всё проверено.'}
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Admin</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-lg font-black">{stats.users}</p>
            <p className="text-[11px] text-slate-300">Пользователей</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-lg font-black">{stats.listings}</p>
            <p className="text-[11px] text-slate-300">Объявлений</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-lg font-black">{stats.applications}</p>
            <p className="text-[11px] text-slate-300">Откликов</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-lg font-black">{totalPending}</p>
            <p className="text-[11px] text-slate-300">К проверке</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink-900">Быстрый доступ</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-lg">{card.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink-900">{card.title}</p>
                  {card.value > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${card.color}`}>
                      {card.value}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{card.desc}</p>
              </div>
              <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink-900">Полный список разделов</p>
            <p className="text-xs text-ink-500">Все инструменты модерации</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/admin/moderation" className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-slate-200">
            Модерация объявлений
          </Link>
          <Link href="/admin/reports" className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-slate-200">
            Жалобы
          </Link>
          <Link href="/admin/flagged" className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-slate-200">
            Подозрительные сообщения
          </Link>
          <Link href="/admin/users" className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-slate-200">
            Пользователи
          </Link>
          <Link href="/admin/reviews" className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-slate-200">
            Отзывы
          </Link>
        </div>
      </section>
    </div>
  );
}

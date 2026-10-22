'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthResponse } from '@teenwork/shared';
import { Icon, type IconName } from './icons';

const USER_ITEMS: readonly [string, string, IconName][] = [['/', 'Вакансии', 'home'], ['/gigs', 'Задания', 'spark'], ['/applications', 'Отклики', 'chat'], ['/documents', 'Документы', 'file'], ['/profile', 'Профиль', 'user']];
const ADMIN_ITEMS: readonly [string, string, IconName][] = [['/admin', 'Обзор', 'home'], ['/admin/moderation', 'Модерация', 'shield'], ['/admin/reports', 'Жалобы', 'flag'], ['/admin/users', 'Люди', 'user']];

export function BottomNav({ session }: { session: AuthResponse | null }) {
  const pathname = usePathname();
  const items = session?.user.role === 'admin' ? ADMIN_ITEMS : USER_ITEMS;
  return <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden"><ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1">{items.map(([href, label, icon]) => { const active = href === '/' ? pathname === '/' : pathname.startsWith(href); return <li key={href} className="flex-1"><Link href={href} className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${active ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}><Icon name={icon} size={17} />{label}</Link></li>; })}</ul></nav>;
}

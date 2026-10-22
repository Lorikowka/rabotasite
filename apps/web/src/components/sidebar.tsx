import Link from 'next/link';
import type { AuthResponse } from '@teenwork/shared';
import { Icon, type IconName } from './icons';
import { LogoutButton } from './logout-button';

const userItems: readonly [string, string, IconName][] = [['/', 'Обзор', 'home'], ['/gigs', 'Быстрые задания', 'spark'], ['/applications', 'Отклики и чаты', 'chat'], ['/documents', 'Документы', 'file'], ['/profile', 'Профиль', 'user'], ['/settings', 'Настройки', 'settings']];
const adminItems: readonly [string, string, IconName][] = [['/admin', 'Обзор', 'home'], ['/admin/moderation', 'Модерация', 'shield'], ['/admin/reports', 'Жалобы', 'flag'], ['/admin/flagged', 'Сообщения', 'alert'], ['/admin/users', 'Пользователи', 'user'], ['/admin/reviews', 'Отзывы', 'star'], ['/settings', 'Настройки', 'settings']];

export function Sidebar({ session }: { session: AuthResponse | null }) {
  const items = session?.user.role === 'admin' ? adminItems : userItems;
  return <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/70 px-4 py-6 lg:block"><nav className="space-y-1">{items.map(([href, label, icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-800"><span className="theme-icon-surface grid h-8 w-8 place-items-center rounded-lg text-brand-700"><Icon name={icon} size={17} /></span>{label}</Link>)}</nav><div className="theme-hero mt-8 rounded-2xl p-4 text-white"><p className="text-xs font-bold uppercase tracking-[.15em] text-accent-300">TeenWork</p><p className="mt-2 text-sm font-semibold leading-relaxed">Безопасные подработки рядом с тобой.</p><p className="theme-hero-muted mt-2 text-xs leading-relaxed">Все отклики и чаты остаются внутри платформы.</p></div>{session && <div className="mt-5 border-t border-slate-200 pt-5"><LogoutButton /></div>}</aside>;
}

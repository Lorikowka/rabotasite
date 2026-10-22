import Link from 'next/link';
import type { AuthResponse } from '@teenwork/shared';
import { initials } from '@teenwork/shared';
import { ModeSwitch } from './mode-switch';
import { NotificationBell } from './notification-bell';
import { LogoutButton } from './logout-button';
import { Icon } from './icons';

export function Header({ session }: { session: AuthResponse | null }) {
  const isAdmin = session?.user.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="theme-hero grid h-10 w-10 place-items-center rounded-xl text-accent-300 shadow-sm shadow-brand-900/20"><Icon name="spark" size={21} /></span>
          <span className="hidden sm:block"><span className="text-xl font-black tracking-tight text-brand-900">Teen<span className="text-brand-500">Work</span></span><span className="ml-2 hidden rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 lg:inline-block">14–18 лет</span></span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <ModeSwitch />
          {session && <Link href="/settings" aria-label="Настройки" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"><Icon name="settings" size={17} /></Link>}
          {session && <NotificationBell />}
          {session ? (isAdmin ? <><Link href="/admin" className="hidden rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 sm:flex">Панель контроля</Link><LogoutButton /></> : <Link href="/profile" className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-xs font-black text-brand-700">{initials(session.user.fullName)}</span><span className="hidden max-w-28 truncate sm:block">{session.user.fullName}</span></Link>) : <Link href="/login" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">Войти</Link>}
        </div>
      </div>
    </header>
  );
}

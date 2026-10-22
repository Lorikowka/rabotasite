import Link from 'next/link';
import type { AuthResponse } from '@teenwork/shared';
import { initials } from '@teenwork/shared';
import { ModeSwitch } from './mode-switch';

export function Header({ session }: { session: AuthResponse | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
            TW
          </span>
          <span className="hidden text-base font-extrabold tracking-tight text-ink-900 sm:block">
            TeenWork
          </span>
        </Link>

        <div className="mx-auto">
          <ModeSwitch />
        </div>

        {session ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full border border-brand-100 py-1 pl-1 pr-3 text-sm font-medium text-ink-700 transition hover:border-brand-300"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials(session.user.fullName)}
            </span>
            <span className="hidden max-w-24 truncate sm:block">{session.user.fullName}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}

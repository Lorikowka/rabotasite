'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MODES = [
  { href: '/', label: 'Вакансии' },
  { href: '/gigs', label: 'Быстрые задания' },
] as const;

export function ModeSwitch() {
  const pathname = usePathname();
  const active = pathname.startsWith('/gigs') ? 'gig' : 'vacancy';

  return (
    <nav aria-label="Режим ленты" className="flex rounded-full bg-brand-50 p-1 text-sm font-medium">
      {MODES.map((mode) => {
        const isActive =
          mode.href === '/' ? active === 'vacancy' : active === 'gig';
        return (
          <Link
            key={mode.href}
            href={mode.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 transition ${
              isActive
                ? 'bg-surface text-brand-700 shadow-sm'
                : 'text-ink-600 hover:text-brand-700'
            }`}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}

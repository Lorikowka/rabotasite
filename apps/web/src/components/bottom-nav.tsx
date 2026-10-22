'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Лента', icon: '🏠' },
  { href: '/applications', label: 'Отклики', icon: '📨' },
  { href: '/documents', label: 'Документы', icon: '📄' },
  { href: '/profile', label: 'Профиль', icon: '🙂' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-surface/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1.5">
        {ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' || pathname === '/gigs' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-700' : 'text-ink-500'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

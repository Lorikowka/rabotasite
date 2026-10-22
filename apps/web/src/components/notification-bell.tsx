'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/api';
import { Icon } from './icons';

export function NotificationBell() {
  const [count, setCount] = useState(0);
  useEffect(() => { clientApi<{ unreadCount: number }>('/api/notifications').then((data) => setCount(data.unreadCount)).catch(() => undefined); }, []);
  return <Link href="/notifications" aria-label="Уведомления" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-brand-900 transition hover:border-brand-300 hover:bg-brand-50"><Icon name="bell" size={17} />{count > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent-400 px-1 text-[10px] font-black text-brand-900">{count > 9 ? '9+' : count}</span>}</Link>;
}

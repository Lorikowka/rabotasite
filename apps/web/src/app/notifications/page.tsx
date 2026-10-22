import type { Metadata } from 'next';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Уведомления' };

export default async function NotificationsPage() {
  const data = await serverApi<{ items: { id: string; type: string; payload: Record<string, unknown>; readAt: string | null; createdAt: string }[] }>('/api/notifications').catch(() => ({ items: [] }));
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Центр событий</p><h1 className="mt-2 text-3xl font-black tracking-tight text-brand-900">Уведомления</h1><p className="mt-2 text-sm text-ink-500">Важные обновления по откликам, чатам и модерации.</p></div><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{data.items.length === 0 ? <div className="p-10 text-center"><p className="text-sm font-semibold text-ink-700">Пока всё тихо</p><p className="mt-1 text-xs text-ink-500">Новые события появятся здесь.</p></div> : <ul className="divide-y divide-slate-100">{data.items.map((item) => <li key={item.id} className={`flex gap-4 p-5 ${item.readAt ? '' : 'bg-brand-50/50'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent-100 text-brand-900">•</span><div className="min-w-0"><p className="text-sm font-bold text-brand-900">{String(item.payload.title ?? item.type)}</p><p className="mt-1 text-sm text-ink-600">{String(item.payload.body ?? item.payload.preview ?? 'У вас новое событие')}</p><p className="mt-2 text-[11px] text-ink-400">{new Date(item.createdAt).toLocaleString('ru-RU')}</p></div></li>)}</ul>}</section></div>;
}

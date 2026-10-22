'use client';
import { useEffect, useState } from 'react';
import type { ListingDTO } from '@teenwork/shared';
import { clientApi } from '@/lib/api';

export default function ModerationPage() {
  const [items, setItems] = useState<ListingDTO[]>([]); const [busy, setBusy] = useState<string | null>(null);
  const load = () => clientApi<{ items: ListingDTO[] }>('/api/admin/listings?status=moderation').then((d) => setItems(d.items)).catch(() => undefined);
  useEffect(() => { load(); }, []);
  const moderate = async (id: string, action: 'approve' | 'block') => { setBusy(id); await clientApi(`/api/admin/listings/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action }) }).catch(() => undefined); await load(); setBusy(null); };
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Контроль качества</p><h1 className="mt-2 text-3xl font-black tracking-tight text-brand-900">Модерация</h1><p className="mt-2 text-sm text-ink-500">Проверяйте объявления до публикации.</p></div><div className="grid gap-4">{items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-ink-500">Очередь модерации пуста.</div> : items.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-4"><div><span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-brand-900">{item.categoryTitle}</span><h2 className="mt-3 text-lg font-black text-brand-900">{item.title}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{item.description}</p></div><div className="text-right text-sm font-bold text-brand-700">{item.paymentAmount} ₽</div></div><div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><button disabled={busy === item.id} onClick={() => moderate(item.id, 'approve')} className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Одобрить</button><button disabled={busy === item.id} onClick={() => moderate(item.id, 'block')} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 disabled:opacity-50">Заблокировать</button></div></article>)}</div></div>;
}

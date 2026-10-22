import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ThemeSettings } from '@/components/theme-settings';

export const metadata: Metadata = { title: 'Настройки' };
export default async function SettingsPage() { const session = await getSession(); if (!session) redirect('/login'); return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Персонализация</p><h1 className="mt-2 text-3xl font-black tracking-tight text-brand-900">Настройки</h1><p className="mt-2 text-sm text-ink-500">Настройте TeenWork под себя.</p></div><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><ThemeSettings /></section></div>; }

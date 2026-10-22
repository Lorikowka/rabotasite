'use client';

import { useEffect, useState } from 'react';

type Theme = 'classic' | 'forest' | 'violet' | 'sunset';
type ColorMode = 'light' | 'dark' | 'system';

const themes: { id: Theme; title: string; description: string; colors: string[] }[] = [
  { id: 'classic', title: 'Ночной индиго', description: 'Основная тема TeenWork', colors: ['#102047', '#315fe2', '#c8ed6b'] },
  { id: 'forest', title: 'Спокойный лес', description: 'Больше зелени и мягкости', colors: ['#0c2e23', '#247b58', '#b7e66a'] },
  { id: 'violet', title: 'Мягкая фиалка', description: 'Чуть более творческий вариант', colors: ['#272052', '#6652d9', '#d8b4ff'] },
  { id: 'sunset', title: 'Тёплый закат', description: 'Тёплая контрастная палитра', colors: ['#4f241d', '#d85c39', '#ffd66b'] },
];

function getSystemMode(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('classic');
  const [mode, setMode] = useState<ColorMode>('dark');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [reduceMotion, setReduceMotion] = useState(false);

  const apply = (nextTheme: Theme, nextMode = mode, nextDensity = density, nextMotion = reduceMotion) => {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.mode = nextMode === 'system' ? getSystemMode() : nextMode;
    document.documentElement.dataset.density = nextDensity;
    document.documentElement.dataset.reduceMotion = String(nextMotion);
    localStorage.setItem('teenwork-theme', nextTheme);
    localStorage.setItem('teenwork-mode', nextMode);
    localStorage.setItem('teenwork-density', nextDensity);
    localStorage.setItem('teenwork-reduce-motion', String(nextMotion));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('teenwork-theme') as Theme | null;
    const savedMode = localStorage.getItem('teenwork-mode') as ColorMode | null;
    const savedDensity = localStorage.getItem('teenwork-density') as 'comfortable' | 'compact' | null;
    const savedMotion = localStorage.getItem('teenwork-reduce-motion') === 'true';
    const nextTheme = savedTheme && themes.some((item) => item.id === savedTheme) ? savedTheme : 'classic';
    const nextMode = savedMode && ['light', 'dark', 'system'].includes(savedMode) ? savedMode : 'dark';
    const nextDensity = savedDensity ?? 'comfortable';

    setTheme(nextTheme);
    setMode(nextMode);
    setDensity(nextDensity);
    setReduceMotion(savedMotion);
    apply(nextTheme, nextMode, nextDensity, savedMotion);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      if (nextMode === 'system') document.documentElement.dataset.mode = getSystemMode();
    };
    media.addEventListener('change', updateSystemTheme);
    return () => media.removeEventListener('change', updateSystemTheme);
  }, []);

  const modeOptions: { id: ColorMode; title: string; description: string }[] = [
    { id: 'light', title: 'Светлая', description: 'Светлый фон и спокойный контраст' },
    { id: 'dark', title: 'Тёмная', description: 'Тёмный фон и светлый текст' },
    { id: 'system', title: 'Системная', description: 'Как в настройках устройства' },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3"><h2 className="text-base font-black text-brand-900">Цветовая тема</h2><p className="mt-1 text-sm text-ink-500">Выберите цветовую палитру интерфейса.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {themes.map((item) => <button key={item.id} type="button" onClick={() => { setTheme(item.id); apply(item.id); }} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme === item.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 bg-white'}`}><span className="flex gap-2">{item.colors.map((color) => <i key={color} className="h-7 w-7 rounded-full shadow-inner" style={{ backgroundColor: color }} />)}</span><p className="mt-3 text-sm font-bold text-brand-900">{item.title}</p><p className="mt-1 text-xs text-ink-500">{item.description}</p></button>)}
        </div>
      </section>

      <section className="border-t border-slate-100 pt-6"><h2 className="text-base font-black text-brand-900">Режим интерфейса</h2><p className="mt-1 text-sm text-ink-500">Настройка влияет на фон, шапку, боковую панель, карточки и текст.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{modeOptions.map((item) => <button key={item.id} type="button" onClick={() => { setMode(item.id); apply(theme, item.id); }} className={`rounded-xl border p-3 text-left text-sm font-semibold ${mode === item.id ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-ink-600'}`}>{item.title}<span className="mt-1 block text-xs font-normal text-ink-500">{item.description}</span></button>)}</div></section>

      <section className="border-t border-slate-100 pt-6"><h2 className="text-base font-black text-brand-900">Плотность интерфейса</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { setDensity('comfortable'); apply(theme, mode, 'comfortable'); }} className={`rounded-xl border p-3 text-left text-sm font-semibold ${density === 'comfortable' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-ink-600'}`}>Комфортная <span className="mt-1 block text-xs font-normal text-ink-500">Больше воздуха и крупнее зоны нажатия</span></button><button type="button" onClick={() => { setDensity('compact'); apply(theme, mode, 'compact'); }} className={`rounded-xl border p-3 text-left text-sm font-semibold ${density === 'compact' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-ink-600'}`}>Компактная <span className="mt-1 block text-xs font-normal text-ink-500">Больше информации на экране</span></button></div></section>

      <section className="border-t border-slate-100 pt-6"><label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-brand-900">Уменьшить анимации</span><span className="mt-1 block text-xs text-ink-500">Полезно при чувствительности к движению</span></span><input type="checkbox" checked={reduceMotion} onChange={(event) => { setReduceMotion(event.target.checked); apply(theme, mode, density, event.target.checked); }} className="h-5 w-5 accent-brand-600" /></label></section>
    </div>
  );
}

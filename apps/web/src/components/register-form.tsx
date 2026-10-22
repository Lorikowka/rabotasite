'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, clientApi } from '@/lib/api';

type Role = 'teen' | 'business' | 'individual';

const ROLE_TABS: { value: Role; label: string; hint: string }[] = [
  { value: 'teen', label: 'Я подросток', hint: 'Ищу подработку или разовые задания' },
  { value: 'business', label: 'Я компания / ИП', hint: 'Ищу помощников на смены' },
  { value: 'individual', label: 'Я частный заказчик', hint: 'Нужна разовая помощь' },
];

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('teen');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputClass =
    'w-full rounded-xl border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload: Record<string, unknown> = { role, fullName, phone };
    if (role === 'teen') payload.birthDate = birthDate;
    if (role === 'business') {
      payload.companyName = companyName;
      payload.inn = inn;
    }

    try {
      await clientApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.push(role === 'teen' ? '/' : '/create');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setRole(tab.value)}
            className={`rounded-xl border p-3 text-left transition ${
              role === tab.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-brand-100 bg-surface hover:border-brand-200'
            }`}
          >
            <span className="block text-sm font-bold text-ink-900">{tab.label}</span>
            <span className="block text-xs text-ink-500">{tab.hint}</span>
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="fullName" className="mb-1 block text-xs font-semibold text-ink-600">
          Имя и фамилия
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder={role === 'teen' ? 'Анна Смирнова' : 'Иван Петров'}
          className={inputClass}
          required
        />
      </div>

      {role === 'teen' && (
        <div>
          <label htmlFor="birthDate" className="mb-1 block text-xs font-semibold text-ink-600">
            Дата рождения
          </label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className={inputClass}
            required
          />
          <p className="mt-1 text-[11px] text-ink-500">
            TeenWork для подростков 14–18 лет. Возраст подтверждается при оформлении работы.
          </p>
        </div>
      )}

      {role === 'business' && (
        <>
          <div>
            <label htmlFor="companyName" className="mb-1 block text-xs font-semibold text-ink-600">
              Название компании
            </label>
            <input
              id="companyName"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Кофейня «Зёрна»"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="inn" className="mb-1 block text-xs font-semibold text-ink-600">
              ИНН (10 или 12 цифр)
            </label>
            <input
              id="inn"
              value={inn}
              onChange={(event) => setInn(event.target.value)}
              placeholder="7701234567"
              inputMode="numeric"
              className={inputClass}
              required
            />
            <p className="mt-1 text-[11px] text-ink-500">
              ИНН проверяется модератором — до проверки объявления уходят на ручную модерацию.
            </p>
          </div>
        </>
      )}

      <div>
        <label htmlFor="regPhone" className="mb-1 block text-xs font-semibold text-ink-600">
          Номер телефона
        </label>
        <input
          id="regPhone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+7 900 123-45-67"
          inputMode="tel"
          className={inputClass}
          required
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
      </button>

      <p className="text-center text-xs text-ink-500">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Войти
        </Link>
      </p>
    </form>
  );
}

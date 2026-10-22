'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, clientApi } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await clientApi<{ devCode?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setDevCode(result.devCode ?? null);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await clientApi('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400';

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <form onSubmit={requestCode} className="space-y-3">
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-ink-600">
              Номер телефона
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 900 123-45-67"
              inputMode="tel"
              autoComplete="tel"
              className={inputClass}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Отправляем код…' : 'Получить код'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-xs text-ink-600">
            Мы отправили код подтверждения на номер <span className="font-semibold">{phone}</span>
          </p>
          {devCode && (
            <p className="rounded-xl bg-accent-100 px-3 py-2 text-xs font-medium text-accent-500">
              Dev-режим: код подтверждения — <span className="font-black">{devCode}</span>
            </p>
          )}
          <div>
            <label htmlFor="code" className="mb-1 block text-xs font-semibold text-ink-600">
              Код из СМС
            </label>
            <input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6 цифр"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`${inputClass} tracking-[0.4em]`}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Проверяем…' : 'Войти'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setCode('');
              setError(null);
            }}
            className="w-full text-xs font-medium text-ink-500 underline"
          >
            Изменить номер
          </button>
        </form>
      )}

      <p className="text-center text-xs text-ink-500">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-semibold text-brand-700 underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

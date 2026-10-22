'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ListingDTO } from '@teenwork/shared';
import { ApiError, clientApi } from '@/lib/api';

export function ApplyButton({
  listing,
  isLoggedIn,
  role,
}: {
  listing: ListingDTO;
  isLoggedIn: boolean;
  role: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [text, setText] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          Войти, чтобы откликнуться
        </button>
        <p className="text-center text-[11px] text-ink-500">
          Отклики видны только заказчику — контакты скрыты.
        </p>
      </div>
    );
  }

  if (role !== 'teen') {
    return (
      <p className="rounded-2xl bg-canvas p-4 text-center text-xs text-ink-600">
        Откликаться могут только соискатели (подростки 14–18 лет).{' '}
        <a href="/create" className="font-semibold text-brand-700">
          Разместить объявление
        </a>
      </p>
    );
  }

  if (state === 'done') {
    return (
      <div className="space-y-2 rounded-2xl bg-emerald-50 p-4 text-center">
        <p className="text-sm font-bold text-emerald-700">Отклик отправлен ✅</p>
        <p className="text-xs text-emerald-700/80">
          Заказчик увидит ваш профиль и напишет в чат.
        </p>
        <button
          type="button"
          onClick={() => router.push('/applications')}
          className="text-xs font-semibold text-emerald-800 underline"
        >
          Мои отклики
        </button>
      </div>
    );
  }

  const submit = async () => {
    setState('sending');
    setMessage(null);
    try {
      await clientApi('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ listingId: listing.id, message: text.trim() || undefined }),
      });
      setState('done');
    } catch (error) {
      setState('idle');
      if (error instanceof ApiError) {
        setMessage(error.message);
      } else {
        setMessage('Не удалось отправить отклик');
      }
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Расскажите, почему подходите (опционально)"
        className="w-full rounded-2xl border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      {message && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{message}</p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={state === 'sending'}
        className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {state === 'sending' ? 'Отправляем…' : 'Откликнуться'}
      </button>
      <p className="text-center text-[11px] text-ink-500">
        Не сообщайте телефон и соцсети — переписка идёт внутри платформы.
      </p>
    </div>
  );
}

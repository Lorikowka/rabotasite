'use client';

import { useState } from 'react';
import { ApiError, clientApi } from '@/lib/api';

const SCORES = [
  { value: 1, label: '😕' },
  { value: 2, label: '🙁' },
  { value: 3, label: '😐' },
  { value: 4, label: '🙂' },
  { value: 5, label: '🤩' },
];

export function ReviewForm({
  applicationId,
  onDone,
}: {
  applicationId: string;
  onDone?: () => void;
}) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
        Спасибо за отзыв! Рейтинг обновлён.
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await clientApi('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          applicationId,
          score,
          comment: comment.trim() || undefined,
        }),
      });
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось отправить отзыв. Попробуйте позже.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl bg-canvas p-3">
      <p className="text-xs font-semibold text-ink-700">Как прошла работа?</p>

      <div className="flex gap-1">
        {SCORES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setScore(item.value)}
            aria-label={`Оценка ${item.value}`}
            aria-pressed={score === item.value}
            className={`text-2xl transition ${
              score === item.value ? 'scale-110' : 'opacity-40 hover:opacity-70'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Что понравилось, что стоит улучшить (необязательно)"
        className="w-full rounded-lg border border-brand-100 bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand-400"
      />

      {error && (
        <p className="rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? 'Отправляем…' : 'Оставить отзыв'}
      </button>
    </div>
  );
}

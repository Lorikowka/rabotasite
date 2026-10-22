'use client';

import { useState } from 'react';
import { ApiError, clientApi } from '@/lib/api';

const REASONS = [
  { value: 'fraud', label: 'Похоже на мошенничество' },
  { value: 'unsafe', label: 'Небезопасные условия для подростка' },
  { value: 'abuse', label: 'Оскорбления или давление' },
  { value: 'spam', label: 'Спам или дубликат' },
  { value: 'other', label: 'Другое' },
];

export function ReportButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!.value);
  const [urgent, setUrgent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-ink-400 underline transition hover:text-rose-500"
      >
        Пожаловаться
      </button>
    );
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
        Спасибо! Жалоба отправлена модераторам.
        {urgent && ' Мы свяжемся с вами и вашими родителями.'}
      </div>
    );
  }

  const submit = async () => {
    setStatus('sending');
    setError(null);
    try {
      await clientApi('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, reason, urgent }),
      });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить жалобу');
    }
  };

  return (
    <div className="space-y-2 rounded-xl bg-canvas p-3">
      <p className="text-xs font-semibold text-ink-700">Что не так с этим объявлением?</p>
      <select
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="w-full rounded-lg border border-brand-100 bg-surface px-2 py-1.5 text-xs"
      >
        {REASONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-xs text-ink-600">
        <input
          type="checkbox"
          checked={urgent}
          onChange={(event) => setUrgent(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-brand-200"
        />
        Это срочно — кажется, что мне угрожают
      </label>
      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={status === 'sending'}
          className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          Отправить
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-brand-100 px-3 py-1.5 text-xs font-medium text-ink-600"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

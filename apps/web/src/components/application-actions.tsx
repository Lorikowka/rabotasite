'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApplicationStatus } from '@teenwork/shared';
import { ApiError, clientApi } from '@/lib/api';

export function ApplicationActions({
  applicationId,
  status,
  role,
  unreadMessages,
}: {
  applicationId: string;
  status: ApplicationStatus;
  role: string;
  unreadMessages: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (next: ApplicationStatus) => {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось изменить статус');
    } finally {
      setBusy(false);
    }
  };

  const isEmployer = role === 'business' || role === 'individual' || role === 'admin';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/chat/${applicationId}`}
          className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
        >
          Чат{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
        </Link>

        {isEmployer && status === 'pending' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => change('accepted')}
              className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 disabled:opacity-60"
            >
              Принять
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => change('rejected')}
              className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-500 disabled:opacity-60"
            >
              Отклонить
            </button>
          </>
        )}

        {isEmployer && status === 'accepted' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change('completed')}
            className="rounded-xl bg-accent-100 px-4 py-2 text-xs font-bold text-accent-500 disabled:opacity-60"
          >
            Отметить выполненным
          </button>
        )}

        {!isEmployer && (status === 'pending' || status === 'accepted') && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change('cancelled')}
            className="rounded-xl border border-brand-100 px-4 py-2 text-xs font-semibold text-ink-600 disabled:opacity-60"
          >
            Отменить отклик
          </button>
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
}

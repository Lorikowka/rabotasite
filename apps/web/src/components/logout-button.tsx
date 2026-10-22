'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientApi } from '@/lib/api';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await clientApi('/api/auth/logout', { method: 'POST' });
        } finally {
          router.push('/');
          router.refresh();
        }
      }}
      className="rounded-xl border border-brand-100 px-4 py-2 text-xs font-semibold text-ink-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
    >
      Выйти
    </button>
  );
}

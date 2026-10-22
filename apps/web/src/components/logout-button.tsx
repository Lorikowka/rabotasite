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
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-ink-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
    >
      <><span aria-hidden="true">↪</span> Выйти</>
    </button>
  );
}

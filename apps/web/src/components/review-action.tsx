'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ReviewForm } from './review-form';

export function ReviewAction({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-accent-100 px-3 py-1.5 text-[11px] font-bold text-accent-500 transition hover:bg-accent-200"
      >
        ⭐ Оставить отзыв
      </button>
    );
  }

  return (
    <div className="w-full">
      <ReviewForm
        applicationId={applicationId}
        onDone={() => {
          router.refresh();
        }}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 text-[11px] font-medium text-ink-400 underline"
      >
        Свернуть
      </button>
    </div>
  );
}

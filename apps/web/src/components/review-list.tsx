import { formatRelative } from '@teenwork/shared';
import type { ReviewDTO } from '@teenwork/shared';

export function ReviewList({ reviews }: { reviews: ReviewDTO[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-xs text-ink-500">
        Отзывов пока нет. Они появятся после первых выполненных заданий.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl bg-canvas p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-accent-500">
              {'★'.repeat(review.score)}
              <span className="text-ink-200">{'★'.repeat(5 - review.score)}</span>
            </span>
            <span className="text-xs font-semibold text-ink-800">{review.from.fullName}</span>
            <span className="ml-auto text-[11px] text-ink-400">
              {formatRelative(review.createdAt)}
            </span>
          </div>
          {review.comment && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{review.comment}</p>
          )}
          {review.badges.length > 0 && (
            <p className="mt-1 text-[11px] text-brand-700">
              {review.badges.map((badge) => `• ${badge}`).join('  ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

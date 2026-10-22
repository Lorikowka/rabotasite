import { BADGES } from '@teenwork/shared';

const BADGE_STYLES: Record<string, string> = {
  on_line: 'bg-emerald-50 text-emerald-700',
  punctual: 'bg-sky-50 text-sky-700',
  verified_profile: 'bg-brand-50 text-brand-700',
  self_employed: 'bg-accent-100 text-accent-500',
  first_job: 'bg-violet-50 text-violet-700',
  five_stars: 'bg-amber-50 text-amber-600',
};

export function BadgeList({ badges }: { badges: string[] }) {
  if (!badges || badges.length === 0) {
    return (
      <p className="text-xs text-ink-500">
        Бейджи появятся после первых откликов и выполненных заданий.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {badges.map((id) => {
        const badge = BADGES[id];
        if (!badge) return null;
        return (
          <li
            key={id}
            title={badge.description}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              BADGE_STYLES[id] ?? 'bg-canvas text-ink-600'
            }`}
          >
            {badge.title}
          </li>
        );
      })}
    </ul>
  );
}

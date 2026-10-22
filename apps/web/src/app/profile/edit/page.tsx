import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProfileEditor } from '@/components/profile-editor';

export const metadata: Metadata = {
  title: 'Редактирование профиля',
  description: 'Настройте информацию и параметры профиля TeenWork.',
};

export default async function EditProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-500">Профиль</p>
          <h1 className="mt-1 text-3xl font-black text-brand-900">Редактирование</h1>
          <p className="mt-2 text-sm text-ink-500">
            Изменения сохраняются в вашем профиле и будут видны другим участникам там, где это разрешено.
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Назад к профилю
        </Link>
      </div>

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100 sm:p-6">
        <h2 className="mb-4 text-sm font-bold text-ink-900">
          {session.user.role === 'teen' ? 'Профиль соискателя' : 'Профиль заказчика'}
        </h2>
        <ProfileEditor session={session} redirectAfterSave="/profile" />
      </section>
    </div>
  );
}

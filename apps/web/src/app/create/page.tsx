import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { CreateListingForm } from '@/components/create-listing-form';

export const metadata: Metadata = {
  title: 'Создать объявление',
  description:
    'Разместите вакансию или быстрое задание для подростков. Автоматическая проверка по ТК РФ и правилам безопасности.',
};

export default async function CreatePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role === 'teen') redirect('/');

  const employer = {
    role: session.user.role,
    verificationStatus: session.employerProfile?.verificationStatus ?? 'none',
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900">Новое объявление</h1>
        <p className="mt-1 text-xs text-ink-600">
          Объявление пройдёт автоматическую проверку по ТК РФ и правилам безопасности. Если
          работодатель — юрлицо, дополнительно потребуется ручная проверка модератором.
        </p>
      </div>

      <CreateListingForm employer={employer} />
    </div>
  );
}

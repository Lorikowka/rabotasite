import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { ApplicationDTO, MessageDTO } from '@teenwork/shared';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';
import { Chat } from '@/components/chat';

export const metadata: Metadata = {
  title: 'Чат по отклику',
  description: 'Безопасный чат с заказчиком внутри платформы TeenWork.',
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const [application, messages] = await Promise.all([
    serverApi<ApplicationDTO>(`/api/applications/${id}`).catch(() => null),
    serverApi<{ items: MessageDTO[] }>(`/api/applications/${id}/messages`).catch(() => ({
      items: [],
    })),
  ]);

  if (!application) notFound();

  const isEmployer = session.user.role !== 'teen';
  const counterpartName = isEmployer
    ? application.teen.fullName
    : (application.employer.companyName ?? application.employer.fullName);

  return (
    <div className="space-y-4">
      <Link
        href="/applications"
        className="inline-flex text-xs font-medium text-ink-500 hover:text-brand-700"
      >
        ← Мои отклики
      </Link>

      <header className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-brand-100">
        <h1 className="text-sm font-bold text-ink-900">{application.listingTitle}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {isEmployer ? 'Соискатель' : 'Заказчик'}:{' '}
          <span className="font-semibold text-ink-700">{counterpartName}</span>
        </p>
      </header>

      <Chat
        applicationId={application.id}
        initialMessages={messages.items}
        currentUserId={session.user.id}
        counterpartName={counterpartName}
      />
    </div>
  );
}

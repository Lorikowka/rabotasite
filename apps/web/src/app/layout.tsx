import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: {
    default: 'TeenWork — подработка и разовые задания для подростков 14–18',
    template: '%s · TeenWork',
  },
  description:
    'Безопасная платформа подработки для подростков 14–18 лет: вакансии и быстрые задания с проверкой по ТК РФ, согласием родителей и защитой от мошенников.',
  keywords: [
    'подработка подросткам',
    'работа от 14 лет',
    'быстрые задания',
    'вакансии для подростков',
    'согласие родителей',
  ],
  openGraph: {
    title: 'TeenWork — подработка для подростков 14–18',
    description:
      'Проверенные вакансии и разовые задания для подростков: только легальные условия, оплата и защита.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4f46e5',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="ru">
      <body className="min-h-dvh font-sans antialiased">
        <div className="flex min-h-dvh flex-col">
          <Header session={session} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 md:pb-10">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-[11px] leading-relaxed text-ink-500 md:pb-8">
            <p>
              TeenWork работает по правилам ТК РФ: подросткам 14–15 лет — до 4 часов в день,
              16–17 лет — до 7 часов, ночные смены запрещены. Все отклики и переписка проходят
              внутри платформы.
            </p>
          </footer>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

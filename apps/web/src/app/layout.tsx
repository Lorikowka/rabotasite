import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { Sidebar } from '@/components/sidebar';
import { ThemeBootstrap } from '@/components/theme-bootstrap';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: { default: 'TeenWork — безопасная подработка', template: '%s · TeenWork' },
  description: 'Безопасные вакансии и разовые задания для подростков 14–18 лет.',
  openGraph: { title: 'TeenWork', description: 'Безопасная подработка рядом с тобой.', type: 'website', locale: 'ru_RU' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#102047' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="ru" data-theme="classic" data-mode="dark" data-density="comfortable" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeBootstrap />
        <div className="min-h-dvh app-grid">
          <Header session={session} />
          <div className="mx-auto flex w-full max-w-[1440px]">
            <Sidebar session={session} />
            <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
              <footer className="mx-auto mt-10 max-w-6xl border-t border-slate-200/80 pt-4 text-[11px] leading-relaxed text-ink-500">TeenWork — безопасная платформа подработки. Отклики, чаты и документы остаются внутри сервиса.</footer>
            </main>
          </div>
          <BottomNav session={session} />
        </div>
      </body>
    </html>
  );
}

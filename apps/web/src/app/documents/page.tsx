import type { Metadata } from 'next';
import Link from 'next/link';
import type { ApplicationDTO } from '@teenwork/shared';
import { API_URL } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Документы и безопасность',
  description:
    'Памятка «5 красных флагов», согласие родителей для скачивания, самозанятость с 14 лет и правила ТК РФ.',
};

interface SafetyMemo {
  title: string;
  intro: string;
  flags: { title: string; text: string }[];
  selfEmployed: { title: string; text: string };
}

export default async function DocumentsPage() {
  const session = await getSession();

  const [memo, applications] = await Promise.all([
    serverApi<SafetyMemo>('/api/documents/safety-memo').catch(() => null),
    session
      ? serverApi<{ items: ApplicationDTO[] }>('/api/applications').catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);

  const activeApplications = applications.items.filter(
    (application) => application.status === 'accepted' || application.status === 'completed',
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-sm">
        <h1 className="text-xl font-extrabold">Документы и безопасность</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-100">
          Всё, что помогает подростку работать легально и не попасться мошенникам.
        </p>
      </section>

      {memo && (
        <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
          <h2 className="text-base font-bold text-ink-900">{memo.title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{memo.intro}</p>

          <ol className="mt-4 space-y-3">
            {memo.flags.map((flag, index) => (
              <li key={flag.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-black text-rose-500">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{flag.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{flag.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {session?.user.role === 'teen' && (
        <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
          <h2 className="text-base font-bold text-ink-900">Согласие родителей</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
            Скачайте PDF-бланк, распечатайте, заполните вместе с родителем и отдайте работодателю
            до начала работы. Документ формируется автоматически с вашими данными и данными
            заказчика.
          </p>

          {activeApplications.length === 0 ? (
            <p className="mt-3 rounded-xl bg-canvas p-3 text-xs text-ink-600">
              Бланк станет доступен, когда заказчик примет ваш отклик.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeApplications.map((application) => (
                <li
                  key={application.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas p-3"
                >
                  <span className="text-xs font-semibold text-ink-800">
                    {application.listingTitle}
                  </span>
                  <a
                    href={`${API_URL}/api/documents/parent-consent?applicationId=${application.id}`}
                    className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white"
                  >
                    ⬇ Скачать PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {session?.user.role !== 'teen' && session && (
        <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
          <h2 className="text-base font-bold text-ink-900">Документы для работодателя</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
            После приглашения соискателя сформируйте трудовой договор по шаблону ТК РФ и примите
            письменное согласие родителя.
          </p>

          {activeApplications.length === 0 ? (
            <p className="mt-3 rounded-xl bg-canvas p-3 text-xs text-ink-600">
              Договор появится здесь, когда вы примете отклик.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeApplications.map((application) => (
                <li
                  key={application.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas p-3"
                >
                  <span className="text-xs font-semibold text-ink-800">
                    {application.teen.fullName} · {application.listingTitle}
                  </span>
                  <a
                    href={`${API_URL}/api/documents/employment-contract?applicationId=${application.id}`}
                    className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white"
                  >
                    ⬇ Договор (PDF)
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {memo && (
        <section className="rounded-2xl bg-accent-100/60 p-5">
          <h2 className="text-base font-bold text-accent-500">{memo.selfEmployed.title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-700">{memo.selfEmployed.text}</p>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-base font-bold text-ink-900">Что говорит закон</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-700">
          <li>
            <span className="font-bold">ст. 92 ТК РФ</span> — несовершеннолетние до 16 лет могут
            работать только легкий труд, не причиняющий вреда здоровью и обучению.
          </li>
          <li>
            <span className="font-bold">ст. 94 ТК РФ</span> — продолжительность смены: до 4 часов
            для 14–15 лет, до 5 часов для 16–17 лет, до 8 часов для 18 лет.
          </li>
          <li>
            <span className="font-bold">ст. 95 ТК РФ</span> — ночные смены несовершеннолетним
            запрещены.
          </li>
          <li>
            <span className="font-bold">ст. 265 ТК РФ</span> — работа несовершеннолетних
            ограничена вредными и опасными условиями, подземными работами, ночной сменой.
          </li>
          <li>
            <span className="font-bold">ст. 266 ТК РФ</span> — заключение трудового договора с
            несовершеннолетним требует письменного согласия родителя.
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-ink-500">
          Это памятка, а не юридическая консультация. При спорных ситуациях обратитесь к юристу или
          в трудовую инспекцию.
        </p>
      </section>

      <section className="rounded-2xl bg-canvas p-5 text-center">
        <p className="text-xs text-ink-600">Нужна помощь?</p>
        <Link
          href="/"
          className="mt-2 inline-block rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white"
        >
          Вернуться к вакансиям
        </Link>
      </section>
    </div>
  );
}

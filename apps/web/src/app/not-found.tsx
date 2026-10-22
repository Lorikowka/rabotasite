import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-xl font-extrabold text-ink-900">Страница не найдена</h1>
      <p className="mt-2 text-sm text-ink-600">
        Возможно, объявление снято работодателем или адрес введён с ошибкой.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/"
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          Открыть ленту вакансий
        </Link>
        <Link
          href="/gigs"
          className="rounded-full bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-700"
        >
          Быстрые задания
        </Link>
      </div>
    </div>
  );
}

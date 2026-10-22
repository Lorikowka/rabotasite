'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-5xl">😕</p>
      <h1 className="mt-4 text-xl font-extrabold text-ink-900">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-ink-600">
        Не удалось загрузить страницу. Проверьте соединение с интернетом и попробуйте ещё раз.
      </p>
      {error.digest && (
        <p className="mt-2 text-[11px] text-ink-400">Код ошибки: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        Попробовать снова
      </button>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в TeenWork, чтобы откликаться на вакансии и общаться с заказчиками.',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-xl font-extrabold text-ink-900">Вход в TeenWork</h1>
      <p className="mt-1 mb-5 text-sm text-ink-600">
        Войдём по номеру телефона — код придёт в СМС.
      </p>

      <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <LoginForm />
      </div>

      <div className="mt-4 rounded-2xl bg-canvas p-4 text-[11px] leading-relaxed text-ink-600">
        <p className="font-bold text-ink-700">Демо-доступы (dev-режим)</p>
        <p className="mt-1">Код подтверждения — 111111</p>
        <ul className="mt-1 space-y-0.5">
          <li>• Подросток 15 лет: +79001234567</li>
          <li>• Подросток 14 лет: +79007654321</li>
          <li>• Подросток 17 лет: +79001112233</li>
          <li>• Подросток 18 лет: +79004445566</li>
          <li>• Кофейня «Зёрна» (бизнес): +79001110000</li>
          <li>• Бизнес на модерации: +79002220000</li>
          <li>• Частный заказчик: +79003330000</li>
          <li>• Модератор (admin): +79009990000</li>
        </ul>
        <Link href="/register" className="mt-2 inline-block font-semibold text-brand-700 underline">
          Создать аккаунт
        </Link>
      </div>
    </div>
  );
}

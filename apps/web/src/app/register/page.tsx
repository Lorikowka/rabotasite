import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Регистрация',
  description:
    'Регистрация в TeenWork: подростки 14–18 лет, компании и частные заказчики. Безопасный старт подработки.',
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-xl font-extrabold text-ink-900">Создать аккаунт</h1>
      <p className="mt-1 mb-5 text-sm text-ink-600">
        Выберите роль — от неё зависит, что вы увидите на платформе.
      </p>

      <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-brand-100">
        <RegisterForm />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { FeedPage, type SearchParams } from '@/components/feed-page';

export const metadata: Metadata = {
  title: 'Вакансии для подростков 14–18 лет',
  description:
    'Проверенные вакансии для подростков: кафе, магазины, офисы. Оплата, график, оформление по ТК РФ и защита от мошенников.',
};

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return <FeedPage type="vacancy" searchParams={params} />;
}

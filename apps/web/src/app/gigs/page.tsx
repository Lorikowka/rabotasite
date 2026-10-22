import type { Metadata } from 'next';
import { FeedPage, type SearchParams } from '@/components/feed-page';

export const metadata: Metadata = {
  title: 'Быстрые задания и разовые подработки',
  description:
    'Разовые задания для подростков: листовки, уборка, монтаж видео, помощь по хозяйству. Оплата за каждый заказ.',
};

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return <FeedPage type="gig" searchParams={params} />;
}

/**
 * Пресеты навыков для «гибридного профиля» подростка.
 */
export interface SkillPreset {
  id: string;
  title: string;
  group: 'digital' | 'offline' | 'soft' | 'lang';
}

export const SKILL_PRESETS: SkillPreset[] = [
  { id: 'capcut', title: 'Монтирую в CapCut', group: 'digital' },
  { id: 'canva', title: 'Делаю карточки в Canva', group: 'digital' },
  { id: 'photoshop', title: 'Работаю в Photoshop', group: 'digital' },
  { id: 'smm', title: 'Веду соцсети / SMM', group: 'digital' },
  { id: 'copywriting', title: 'Грамотно пишу тексты', group: 'digital' },
  { id: 'excel', title: 'Умею в Excel / таблицы', group: 'digital' },
  { id: 'design', title: 'Рисую, умею в Figma', group: 'digital' },
  { id: 'translate', title: 'Перевожу тексты', group: 'digital' },
  { id: 'dogs', title: 'Лажу с собаками', group: 'offline' },
  { id: 'animals', title: 'Ухаживаю за животными', group: 'offline' },
  { id: 'promo', title: 'Раздаю листовки, работаю промоутером', group: 'offline' },
  { id: 'delivery', title: 'Развожу заказы / курьер', group: 'offline' },
  { id: 'cafe', title: 'Работал(а) в кафе', group: 'offline' },
  { id: 'warehouse', title: 'Собираю заказы на складе', group: 'offline' },
  { id: 'help_kids', title: 'Сижу с младшими школьниками', group: 'soft' },
  { id: 'endurance', title: 'Выносливый(ая)', group: 'soft' },
  { id: 'responsible', title: 'Ответственный(ая)', group: 'soft' },
  { id: 'friendly', title: 'Коммуникабельный(ая)', group: 'soft' },
  { id: 'punctual', title: 'Пунктуальный(ая)', group: 'soft' },
  { id: 'english_b1', title: 'Английский B1', group: 'lang' },
  { id: 'english_b2', title: 'Английский B2', group: 'lang' },
  { id: 'german_a2', title: 'Немецкий A2', group: 'lang' },
  { id: 'chinese_a1', title: 'Китайский A1', group: 'lang' },
];

export const SKILL_IDS = SKILL_PRESETS.map((s) => s.id);

export function getSkill(id: string): SkillPreset | undefined {
  return SKILL_PRESETS.find((s) => s.id === id);
}

/** Автоматические бейджи за репутацию. */
export const BADGES: Record<string, { title: string; description: string }> = {
  on_line: {
    title: 'На связи',
    description: 'Отвечает в чате в течение 15 минут',
  },
  punctual: {
    title: 'Пунктуальный',
    description: '5 заданий выполнено без опозданий',
  },
  verified_profile: {
    title: 'Проверенный профиль',
    description: 'Загружено согласие родителей',
  },
  self_employed: {
    title: 'Самозанятый',
    description: 'Оформлен статус НПД',
  },
  first_job: {
    title: 'Первая подработка',
    description: 'Выполнено первое задание на платформе',
  },
  five_stars: {
    title: 'Пять звёзд',
    description: 'Средняя оценка 5.0 по отзывам',
  },
};

export interface BadgeInput {
  parentConsentUploaded: boolean;
  isSelfEmployed: boolean;
  completedGigs: number;
  onTimeStreak: number;
  avgResponseMinutes: number;
  rating: number;
  ratingCount: number;
}

/** Вычисляет набор автоматических бейджей профиля. */
export function computeBadges(input: BadgeInput): string[] {
  const badges: string[] = [];
  if (input.parentConsentUploaded) badges.push('verified_profile');
  if (input.isSelfEmployed) badges.push('self_employed');
  if (input.completedGigs >= 1) badges.push('first_job');
  if (input.onTimeStreak >= 5) badges.push('punctual');
  if (input.avgResponseMinutes > 0 && input.avgResponseMinutes <= 15) badges.push('on_line');
  if (input.ratingCount >= 3 && input.rating >= 4.8) badges.push('five_stars');
  return badges;
}

/**
 * Генерация PDF-документов: согласие родителя и срочный трудовой договор.
 *
 * Кириллица требует встраивания TTF-шрифта (стандартные шрифты PDF — WinAnsi).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** apps/api/assets/fonts (одинаково для src/ и dist/) */
const FONTS_DIR = path.resolve(HERE, '..', '..', 'assets', 'fonts');

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

let fontBytesCache: { regular: Uint8Array; bold: Uint8Array } | null = null;

async function getFontBytes(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  if (fontBytesCache) return fontBytesCache;
  const [regular, bold] = await Promise.all([
    readFile(path.join(FONTS_DIR, 'Roboto-Regular.ttf')),
    readFile(path.join(FONTS_DIR, 'Roboto-Bold.ttf')),
  ]);
  fontBytesCache = { regular: new Uint8Array(regular), bold: new Uint8Array(bold) };
  return fontBytesCache;
}

async function createDocument(): Promise<{ doc: PDFDocument; fonts: Fonts }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const bytes = await getFontBytes();
  const regular = await doc.embedFont(bytes.regular, { subset: true });
  const bold = await doc.embedFont(bytes.bold, { subset: true });
  const mono = await doc.embedFont(StandardFonts.Courier);
  return { doc, fonts: { regular, bold, mono } };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

interface Cursor {
  page: PDFPage;
  y: number;
  fonts: Fonts;
}

function drawLine(
  cursor: Cursor,
  text: string,
  options: {
    size?: number;
    bold?: boolean;
    indent?: number;
    gap?: number;
    color?: ReturnType<typeof rgb>;
    align?: 'left' | 'center';
  } = {},
): void {
  const size = options.size ?? 11;
  const font = options.bold ? cursor.fonts.bold : cursor.fonts.regular;
  const indent = options.indent ?? 0;
  const gap = options.gap ?? 4;
  const maxWidth = A4.width - MARGIN * 2 - indent;

  const lines = wrapText(text, font, size, maxWidth);
  const lineHeight = size * 1.45;

  for (const line of lines) {
    if (cursor.y - lineHeight < MARGIN + 30) {
      cursor.page = cursor.page.doc.addPage([A4.width, A4.height]);
      cursor.y = A4.height - MARGIN;
    }
    const x =
      options.align === 'center'
        ? (A4.width - font.widthOfTextAtSize(line, size)) / 2
        : MARGIN + indent;
    cursor.page.drawText(line, {
      x,
      y: cursor.y - lineHeight,
      size,
      font,
      color: options.color ?? rgb(0.08, 0.09, 0.12),
    });
    cursor.y -= lineHeight;
  }
  cursor.y -= gap;
}

function drawRule(cursor: Cursor): void {
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: A4.width - MARGIN, y: cursor.y },
    thickness: 0.8,
    color: rgb(0.75, 0.77, 0.82),
  });
  cursor.y -= 16;
}

function addFooter(doc: PDFDocument, fonts: Fonts): void {
  const pages = doc.getPages();
  for (const [index, page] of pages.entries()) {
    const text = `Платформа TeenWork · страница ${index + 1} из ${pages.length}`;
    const size = 8;
    page.drawText(text, {
      x: (A4.width - fonts.regular.widthOfTextAtSize(text, size)) / 2,
      y: 28,
      size,
      font: fonts.regular,
      color: rgb(0.55, 0.57, 0.62),
    });
  }
}

export interface ParentConsentData {
  childFullName: string;
  childBirthDate: string;
  childAge: number;
  employerName: string;
  employerInn: string | null;
  employerIsBusiness: boolean;
  jobTitle: string;
  workAddress: string;
  workSchedule: string;
  paymentTerms: string;
  workStartDate: string;
  applicationId: string;
}

/** PDF-бланк «Согласие родителя (законного представителя) на трудоустройство несовершеннолетнего». */
export async function generateParentConsentPdf(data: ParentConsentData): Promise<Uint8Array> {
  const { doc, fonts } = await createDocument();
  const page = doc.addPage([A4.width, A4.height]);
  const cursor: Cursor = { page, y: A4.height - MARGIN, fonts };

  drawLine(cursor, 'СОГЛАСИЕ РОДИТЕЛЯ (ЗАКОННОГО ПРЕДСТАВИТЕЛЯ)', {
    size: 14,
    bold: true,
    align: 'center',
    gap: 2,
  });
  drawLine(cursor, 'на трудоустройство несовершеннолетнего', {
    size: 12,
    bold: true,
    align: 'center',
    gap: 6,
  });
  drawLine(
    cursor,
    'Я, законный представитель несовершеннолетнего, даю согласие на трудоустройство моего ребёнка и подтверждаю достоверность представленных сведений.',
    { size: 11, gap: 10 },
  );

  const field = (label: string, value: string) => {
    drawLine(cursor, `${label}: ${value}`, { size: 11, indent: 10, gap: 4 });
  };

  field('Фамилия, имя ребёнка', data.childFullName);
  field('Дата рождения', data.childBirthDate);
  field('Возраст на дату подписания', `${data.childAge} лет`);
  drawLine(cursor, 'Сведения о работодателе', { size: 12, bold: true, gap: 6 });
  field('Наименование / ФИО работодателя', data.employerName);
  if (data.employerIsBusiness && data.employerInn) {
    field('ИНН', data.employerInn);
  }
  field('Должность или содержание задания', data.jobTitle);
  field('Место работы', data.workAddress);
  field('График работы', data.workSchedule);
  field('Условия оплаты', data.paymentTerms);
  field('Предполагаемая дата начала работы', data.workStartDate);

  drawLine(cursor, '', { gap: 6 });
  drawRule(cursor);

  drawLine(
    cursor,
    'Я подтверждаю, что ознакомлен(а) с ограничениями ТК РФ на труд несовершеннолетних (статьи 92, 94, 95, 265 ТК РФ): продолжительность смены, запрет ночных смен и запрет работ, связанных с вредными и опасными условиями труда, а также обязуюсь обеспечить явку ребёнка на работу в согласованные с работодателем сроки.',
    { size: 10, gap: 8, color: rgb(0.25, 0.27, 0.33) },
  );

  drawLine(cursor, '', { gap: 14 });
  const signY = cursor.y;
  drawLine(cursor, '___________________________ / _________________________ /', {
    size: 11,
    gap: 2,
  });
  drawLine(cursor, '        подпись                    расшифровка подписи', {
    size: 9,
    color: rgb(0.45, 0.47, 0.52),
    gap: 2,
  });
  drawLine(cursor, 'Дата: «____» ______________ 20____ г.', { size: 11, gap: 2 });
  cursor.y = signY;

  drawLine(
    cursor,
    `Документ сформирован платформой TeenWork. Номер отклика: ${data.applicationId}. Оригинал заполненного бланка необходимо передать работодателю до начала работы.`,
    { size: 8.5, color: rgb(0.5, 0.52, 0.57), gap: 0 },
  );

  addFooter(doc, fonts);
  return doc.save();
}

export interface EmploymentContractData {
  employeeFullName: string;
  employeeBirthDate: string;
  employerName: string;
  employerInn: string | null;
  employerIsBusiness: boolean;
  jobTitle: string;
  workAddress: string;
  workSchedule: string;
  payment: string;
  contractTerm: string;
  applicationId: string;
}

/** Шаблон срочного трудового договора с несовершеннолетним. */
export async function generateEmploymentContractPdf(
  data: EmploymentContractData,
): Promise<Uint8Array> {
  const { doc, fonts } = await createDocument();
  const page = doc.addPage([A4.width, A4.height]);
  const cursor: Cursor = { page, y: A4.height - MARGIN, fonts };

  drawLine(cursor, 'СРОЧНЫЙ ТРУДОВОЙ ДОГОВОР', { size: 14, bold: true, align: 'center', gap: 2 });
  drawLine(cursor, 'с несовершеннолетним работником', { size: 11, align: 'center', gap: 12 });

  const field = (label: string, value: string) => {
    drawLine(cursor, `${label}: ${value}`, { size: 11, indent: 10, gap: 4 });
  };

  field('г. Москва', new Date().toLocaleDateString('ru-RU'));
  field('Работодатель', data.employerName);
  if (data.employerIsBusiness && data.employerInn) field('ИНН работодателя', data.employerInn);
  field('Работник', data.employeeFullName);
  field('Дата рождения работника', data.employeeBirthDate);
  drawLine(cursor, '', { gap: 4 });

  const clause = (number: string, text: string) => {
    drawLine(cursor, `${number}. ${text}`, { size: 11, indent: 10, gap: 6 });
  };

  clause(
    '1.1',
    `Работник принимается на работу на должность «${data.jobTitle}» по месту работы: ${data.workAddress}.`,
  );
  clause('1.2', `График работы: ${data.workSchedule}.`);
  clause('1.3', `Оплата труда: ${data.payment}.`);
  clause('1.4', `Срок договора: ${data.contractTerm}.`);
  clause(
    '2.1',
    'Настоящий договор заключён в соответствии с ТК РФ. Соблюдение ограничений на труд несовершеннолетних (ст. 92, 94, 95, 265 ТК РФ) является обязательным для Сторон.',
  );
  clause(
    '2.2',
    'Работодатель обеспечивает оформление письменного согласия родителя (законного представителя) до допуска работника к работе.',
  );
  clause(
    '3.1',
    'Стороны вправе расторгнуть договор в порядке, установленном ТК РФ, с учётом дополнительных оснований для несовершеннолетних работников.',
  );

  drawLine(cursor, '', { gap: 16 });
  drawLine(cursor, 'Работодатель: ______________________ / ______________________', { size: 11, gap: 6 });
  drawLine(cursor, 'Работник:          ______________________ / ______________________', { size: 11, gap: 6 });
  drawLine(cursor, 'Дата: «____» ______________ 20____ г.', { size: 11, gap: 10 });

  drawLine(
    cursor,
    `Шаблон сформирован платформой TeenWork. Номер отклика: ${data.applicationId}. Перед подписанием рекомендуется обратиться к юристу.`,
    { size: 8.5,
      color: rgb(0.5, 0.52, 0.57),
      gap: 0,
    },
  );

  addFooter(doc, fonts);
  return doc.save();
}

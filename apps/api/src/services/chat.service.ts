import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb, messages, newId, nowIso, reports } from '@teenwork/db';
import type { MessageRow, UserRow } from '@teenwork/db';
import type { MessageDTO } from '@teenwork/shared';
import { scanForExternalContacts } from '@teenwork/shared';
import { badRequest } from '../lib/errors.js';
import { toMessageDTO } from '../lib/dto.js';
import { getApplicationForParticipant } from './application.service.js';
import { createNotification } from './notification.service.js';

const db = getDb();

export async function listMessages(
  applicationId: string,
  userId: string,
): Promise<MessageDTO[]> {
  await getApplicationForParticipant(applicationId, userId);

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.applicationId, applicationId))
    .orderBy(asc(messages.createdAt));

  return rows.map(toMessageDTO);
}

export async function sendMessage(
  applicationId: string,
  sender: UserRow,
  body: string,
): Promise<MessageDTO> {
  const { application, listing } = await getApplicationForParticipant(applicationId, sender.id);

  const trimmed = body.trim();
  if (!trimmed) throw badRequest('Сообщение не может быть пустым');

  const hits = scanForExternalContacts(trimmed);
  const warnings = hits.map((hit) => hit.message);
  // Сообщение не блокируется — оно отправляется с предупреждением,
  // но помечается для модератора (внешние контакты — главный признак
  // увода общения с платформы).
  const flagged = hits.length > 0;

  const id = newId();
  const timestamp = nowIso();

  await db.insert(messages).values({
    id,
    applicationId,
    senderId: sender.id,
    body: trimmed,
    warnings,
    flagged,
    readAt: null,
    createdAt: timestamp,
  });

  const recipientId =
    sender.id === application.teenId ? listing.employerId : application.teenId;

  await createNotification(recipientId, 'new_message', {
    applicationId,
    listingTitle: listing.title,
    senderName: sender.fullName,
    preview: trimmed.slice(0, 80),
  });

  const row = (await db.select().from(messages).where(eq(messages.id, id)).limit(1))[0]!;

  // Автоматическая жалоба модераторам: сообщение с внешними контактами.
  if (flagged) {
    await db.insert(reports).values({
      id: newId(),
      reporterId: sender.id,
      targetType: 'message',
      targetId: id,
      reason: `Автопроверка чата: ${warnings.join('; ')}`,
      urgent: false,
      status: 'new',
      createdAt: timestamp,
    });
  }

  return toMessageDTO(row);
}

export async function markMessagesRead(applicationId: string, userId: string): Promise<void> {
  await db
    .update(messages)
    .set({ readAt: nowIso() })
    .where(
      and(
        eq(messages.applicationId, applicationId),
        sql`${messages.readAt} is null`,
        sql`${messages.senderId} != ${userId}`,
      ),
    );
}

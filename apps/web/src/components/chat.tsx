'use client';

import { useEffect, useRef, useState } from 'react';
import type { MessageDTO } from '@teenwork/shared';
import { formatRelative } from '@teenwork/shared';
import { API_URL, ApiError, clientApi } from '@/lib/api';

export function Chat({
  applicationId,
  initialMessages,
  currentUserId,
  counterpartName,
}: {
  applicationId: string;
  initialMessages: MessageDTO[];
  currentUserId: string;
  counterpartName: string;
}) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wsUrl = `${API_URL.replace(/^http/, 'ws')}/api/chat/ws?applicationId=${applicationId}`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => setConnected(false);
      socket.onerror = () => setConnected(false);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as {
            type: string;
            payload: MessageDTO & { message?: string };
          };
          if (data.type === 'message' && data.payload?.id) {
            const incoming = data.payload;
            setMessages((current) =>
              current.some((message) => message.id === incoming.id)
                ? current
                : [...current, incoming],
            );
          }
        } catch {
          /* игнорируем некорректный кадр */
        }
      };
    } catch {
      setConnected(false);
    }

    // Отмечаем сообщения прочитанными.
    void clientApi(`/api/applications/${applicationId}/read`, { method: 'POST' }).catch(() => undefined);

    return () => {
      socket?.close();
      socketRef.current = null;
    };
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    setError(null);

    try {
      const message = await clientApi<MessageDTO>(`/api/applications/${applicationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить сообщение');
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="mb-3 flex items-center gap-2 text-[11px] text-ink-500">
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-ink-300'}`}
          aria-hidden
        />
        {connected ? 'в сети' : 'нет соединения — переписка будет отправлена позже'}
      </div>

      <div className="flex-1 space-y-2">
        {messages.length === 0 && (
          <p className="rounded-2xl bg-surface p-6 text-center text-xs text-ink-500 shadow-sm ring-1 ring-brand-100">
            Сообщений пока нет. Напишите {counterpartName} — не забудьте договориться о графике и
            месте встречи.
          </p>
        )}

        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface text-ink-800 ring-1 ring-brand-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`mt-1 text-right text-[10px] ${
                    mine ? 'text-brand-100' : 'text-ink-400'
                  }`}
                >
                  {formatRelative(message.createdAt)}
                </p>

                {message.warnings.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-xl bg-accent-100/70 p-2 text-[11px] leading-snug text-accent-500">
                    {message.warnings.map((warning, index) => (
                      <li key={index}>⚠ {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-20 mt-3 space-y-2 rounded-2xl bg-surface p-3 shadow-sm ring-1 ring-brand-100 md:bottom-4">
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void send();
            }}
            placeholder="Сообщение…"
            maxLength={1000}
            className="flex-1 rounded-xl border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => void send()}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            ➤
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-ink-400">
          Не отправляйте телефон, паспорт и ссылки на другие мессенджеры — такие сообщения
          проверяются модераторами.
        </p>
      </div>
    </div>
  );
}

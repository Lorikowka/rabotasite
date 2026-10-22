/**
 * Простой хаб для WebSocket-чата: держит соединения по откликам и рассылает сообщения.
 * В MVP достаточно in-memory; при масштабировании заменяется на Redis Pub/Sub.
 */
import type { WebSocket } from 'ws';

export interface ChatEvent {
  type: 'message' | 'typing' | 'read';
  applicationId: string;
  payload: unknown;
}

export class ChatHub {
  private readonly rooms = new Map<string, Set<WebSocket>>();

  join(applicationId: string, socket: WebSocket): void {
    const room = this.rooms.get(applicationId) ?? new Set<WebSocket>();
    room.add(socket);
    this.rooms.set(applicationId, room);
  }

  leave(applicationId: string, socket: WebSocket): void {
    const room = this.rooms.get(applicationId);
    if (!room) return;
    room.delete(socket);
    if (room.size === 0) this.rooms.delete(applicationId);
  }

  broadcast(applicationId: string, event: ChatEvent, except?: WebSocket): void {
    const room = this.rooms.get(applicationId);
    if (!room) return;
    const data = JSON.stringify(event);
    for (const socket of room) {
      if (socket === except) continue;
      if (socket.readyState === 1) socket.send(data);
    }
  }

  participants(applicationId: string): number {
    return this.rooms.get(applicationId)?.size ?? 0;
  }
}

export const chatHub = new ChatHub();

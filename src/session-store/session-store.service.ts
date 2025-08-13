// src/session-store.service.ts
import { Injectable } from '@nestjs/common';

interface ChatSession {
  budgetMin?: number;
  budgetMax?: number;
  categoryId?: number;
  lastQuery?: string;
}

@Injectable()
export class SessionStoreService {
  private sessions = new Map<string, ChatSession>();

  getSession(sessionId: string): ChatSession {
    return this.sessions.get(sessionId) || {};
  }

  updateSession(sessionId: string, data: Partial<ChatSession>) {
    const existing = this.getSession(sessionId);
    this.sessions.set(sessionId, { ...existing, ...data });
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

import { prisma } from '@/shared/db.singleton';
import type { ChatSessionDetail, ChatSessionSummary } from './chat.types';

export async function createSession(title?: string): Promise<ChatSessionSummary> {
  return prisma.chatSession.create({ data: title ? { title } : {} });
}

export async function getSession(id: string): Promise<ChatSessionDetail | null> {
  return prisma.chatSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getSessions(): Promise<ChatSessionSummary[]> {
  return prisma.chatSession.findMany({ orderBy: { updatedAt: 'desc' } });
}

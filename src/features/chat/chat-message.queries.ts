import { prisma } from '@/shared/db.singleton';
import type { ChatMessageRow } from './chat.types';

type AddMessageInput = {
  sessionId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
};

export async function addMessage(input: AddMessageInput): Promise<ChatMessageRow> {
  return prisma.chatMessage.create({ data: input });
}

export async function getMessages(sessionId: string): Promise<ChatMessageRow[]> {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

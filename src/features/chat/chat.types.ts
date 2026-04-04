import type { Prisma } from '../../../generated/prisma/client';

export type ChatSessionSummary = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatSessionDetail = ChatSessionSummary & {
  messages: ChatMessageRow[];
};

export type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  toolCallId: string | null;
  toolName: string | null;
  createdAt: Date;
};

export type McpServerRow = {
  id: string;
  name: string;
  command: string;
  args: Prisma.JsonValue;
  env: Prisma.JsonValue;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMcpServerInput = {
  name: string;
  command: string;
  args?: Prisma.InputJsonValue;
  env?: Prisma.InputJsonValue;
  enabled?: boolean;
};

export type UpdateMcpServerInput = {
  name?: string;
  command?: string;
  args?: Prisma.InputJsonValue;
  env?: Prisma.InputJsonValue;
  enabled?: boolean;
};

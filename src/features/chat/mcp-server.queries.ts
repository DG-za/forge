import { prisma } from '@/shared/db.singleton';
import type { CreateMcpServerInput, McpServerRow, UpdateMcpServerInput } from './chat.types';

export async function createMcpServer(input: CreateMcpServerInput): Promise<McpServerRow> {
  return prisma.mcpServer.create({ data: input });
}

export async function getMcpServers(): Promise<McpServerRow[]> {
  return prisma.mcpServer.findMany({ orderBy: { name: 'asc' } });
}

export async function updateMcpServer(id: string, input: UpdateMcpServerInput): Promise<McpServerRow> {
  return prisma.mcpServer.update({ where: { id }, data: input });
}

export async function deleteMcpServer(id: string): Promise<void> {
  await prisma.mcpServer.delete({ where: { id } });
}

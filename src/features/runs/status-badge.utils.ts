export type StatusConfig = {
  label: string;
  colorClass: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // Run statuses
  pending: { label: 'Pending', colorClass: 'bg-yellow-500/20 text-yellow-400' },
  planning: { label: 'Planning', colorClass: 'bg-yellow-500/20 text-yellow-400' },
  in_progress: { label: 'Running', colorClass: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed', colorClass: 'bg-green-500/20 text-green-400' },
  failed: { label: 'Failed', colorClass: 'bg-red-500/20 text-red-400' },
  // Issue statuses
  queued: { label: 'Queued', colorClass: 'bg-gray-500/20 text-gray-400' },
  coding: { label: 'Coding', colorClass: 'bg-blue-500/20 text-blue-400' },
  gates: { label: 'Gates', colorClass: 'bg-blue-500/20 text-blue-400' },
  reviewing: { label: 'Reviewing', colorClass: 'bg-purple-500/20 text-purple-400' },
  fixing: { label: 'Fixing', colorClass: 'bg-yellow-500/20 text-yellow-400' },
  done: { label: 'Done', colorClass: 'bg-green-500/20 text-green-400' },
  escalated: { label: 'Escalated', colorClass: 'bg-red-500/20 text-red-400' },
};

const FALLBACK: StatusConfig = { label: 'Unknown', colorClass: 'bg-gray-500/20 text-gray-400' };

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? FALLBACK;
}

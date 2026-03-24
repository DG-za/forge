import { getStatusConfig } from './status-badge.utils';

export function StatusBadge({ status }: { status: string }) {
  const { label, colorClass } = getStatusConfig(status);

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>{label}</span>;
}

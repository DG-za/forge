import { Badge } from '@/components/ui/badge.component';
import { getStatusConfig } from '../status-badge.utils';

export function StatusBadge({ status }: { status: string }) {
  const { label, colorClass } = getStatusConfig(status);

  return (
    <Badge variant="secondary" className={colorClass}>
      {label}
    </Badge>
  );
}

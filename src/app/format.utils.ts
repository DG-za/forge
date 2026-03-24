const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;

export function formatRelativeTime(date: Date, now = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1_000);

  if (seconds < MINUTE) return 'just now';
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;

  const days = Math.floor(seconds / DAY);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

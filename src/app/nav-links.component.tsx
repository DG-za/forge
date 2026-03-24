'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/runs/new', label: 'New Run' },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {LINKS.map(({ href, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Button
            key={href}
            variant="ghost"
            size="sm"
            className={isActive ? 'bg-muted text-accent' : 'text-muted-foreground'}
            render={<Link href={href} />}
          >
            {label}
          </Button>
        );
      })}
    </nav>
  );
}

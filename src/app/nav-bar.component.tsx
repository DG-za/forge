import { FlameIcon } from '@/app/flame-icon.component';
import { NavLinks } from '@/app/nav-links.component';

export function NavBar() {
  return (
    <header className="border-border bg-card/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FlameIcon className="text-primary h-6 w-6" />
          <span className="text-foreground text-lg font-bold tracking-tight">Forge</span>
        </div>
        <NavLinks />
      </div>
    </header>
  );
}

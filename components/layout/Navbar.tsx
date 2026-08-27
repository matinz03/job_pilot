import Image from "next/image";
import Link from "next/link";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { navigationItems, type NavigationItemId } from "@/lib/navigation";

type NavbarProps = {
  isAuthenticated?: boolean;
  activeItem?: NavigationItemId;
};

const navigationIcons = {
  dashboard: DashboardIcon,
  "find-jobs": SearchIcon,
  profile: ProfileIcon,
};

export function Navbar({ isAuthenticated = false, activeItem }: NavbarProps) {
  return (
    <header className="h-20 border-b border-border bg-surface">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" aria-label="JobPilot home" className="shrink-0">
          <Image src="/logo.png" alt="JobPilot" width={151} height={48} priority />
        </Link>
        <div className="hidden h-full items-center gap-8 text-sm font-medium md:flex">
          {navigationItems.map((item) => {
            const isActive = item.id === activeItem;
            const Icon = navigationIcons[item.id];

            return (
              <Link
                className={`flex h-full items-center gap-2 border-b-2 px-1 transition-colors hover:text-accent ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-dark"
                }`}
                href={item.href}
                key={item.id}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden md:block">
          {isAuthenticated ? (
            <SignOutButton />
          ) : (
            <Link
              className="rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover"
              href="/login"
            >
              Start for free
            </Link>
          )}
        </div>
        <MobileNavigation activeItem={activeItem} isAuthenticated={isAuthenticated} />
      </nav>
    </header>
  );
}

type IconProps = {
  className?: string;
};

function DashboardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect height="7" rx="1" stroke="currentColor" strokeWidth="1.8" width="7" x="3" y="3" />
      <rect height="7" rx="1" stroke="currentColor" strokeWidth="1.8" width="7" x="14" y="3" />
      <rect height="7" rx="1" stroke="currentColor" strokeWidth="1.8" width="7" x="3" y="14" />
      <rect height="7" rx="1" stroke="currentColor" strokeWidth="1.8" width="7" x="14" y="14" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ProfileIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c.7-3.2 3.1-5 7-5s6.3 1.8 7 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

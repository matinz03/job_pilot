import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";

type NavbarProps = {
  isAuthenticated?: boolean;
  activeItem?: "dashboard" | "find-jobs" | "profile";
};

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", id: "dashboard" },
  { href: "/find-jobs", label: "Find Jobs", id: "find-jobs" },
  { href: "/profile", label: "Profile", id: "profile" },
] as const;

export function Navbar({ isAuthenticated = false, activeItem }: NavbarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface">
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

            return (
              <Link
                className={`flex h-full items-center border-b-2 px-1 transition-colors hover:text-accent ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-dark"
                }`}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
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
      </nav>
    </header>
  );
}

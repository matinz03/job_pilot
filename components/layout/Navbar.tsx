import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";

type NavbarProps = {
  isAuthenticated?: boolean;
};

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" aria-label="JobPilot home" className="shrink-0">
          <Image src="/logo.png" alt="JobPilot" width={151} height={48} priority />
        </Link>
        <div className="hidden items-center gap-10 text-sm font-medium text-text-dark md:flex">
          <Link className="transition-colors hover:text-accent" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition-colors hover:text-accent" href="/find-jobs">
            Find Jobs
          </Link>
          <Link className="transition-colors hover:text-accent" href="/profile">
            Profile
          </Link>
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

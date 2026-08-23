import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" aria-label="JobPilot home" className="shrink-0">
          <Image src="/logo.png" alt="JobPilot" width={151} height={48} />
        </Link>
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-text-dark">
          <Link className="transition-colors hover:text-accent" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition-colors hover:text-accent" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="transition-colors hover:text-accent" href="/terms">
            Terms &amp; Condition
          </Link>
        </div>
      </div>
    </footer>
  );
}

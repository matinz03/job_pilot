"use client";

import { useState } from "react";
import Link from "next/link";
import { navigationItems, type NavigationItemId } from "@/lib/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";

type MobileNavigationProps = {
  activeItem?: NavigationItemId;
  isAuthenticated: boolean;
};

export function MobileNavigation({ activeItem, isAuthenticated }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        aria-controls="mobile-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="grid size-10 place-items-center rounded-md text-text-dark transition-colors hover:bg-surface-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <MenuIcon open={isOpen} />
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-border bg-surface p-2 shadow-card"
          id="mobile-navigation"
        >
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = item.id === activeItem;
              return (
                <Link
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary hover:text-accent ${
                    isActive ? "bg-accent-light text-accent" : "text-text-dark"
                  }`}
                  href={item.href}
                  key={item.id}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-2 border-t border-border pt-2">
            {isAuthenticated ? (
              <SignOutButton fullWidth />
            ) : (
              <Link
                className="block rounded-md bg-overlay px-3 py-2 text-center text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover"
                href="/login"
                onClick={() => setIsOpen(false)}
              >
                Start for free
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      )}
    </svg>
  );
}

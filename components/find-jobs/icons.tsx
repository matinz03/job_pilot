export function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function SparkleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v6m-3-3h6M6.5 12.5v5m-2.5-2.5h5m6.5-4 1.6 4.4L20 18l-4.4 1.6L14 24l-1.6-4.4L8 18l4.4-1.6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function CompanyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24">
      <path d="M4 20h16M6 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M15 20V9h2a1 1 0 0 1 1 1v10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M9 8h2M9 11h2M9 14h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

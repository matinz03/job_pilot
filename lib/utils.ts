const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Renders a timestamp the way the jobs table shows it: "2 hours ago", "Yesterday", "3 days ago".
 * `now` is injectable so the output can be exercised without depending on the clock.
 */
export function formatRelativeTime(timestamp: string, now: Date = new Date()): string {
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) return "";

  const elapsed = now.getTime() - then.getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  return then.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

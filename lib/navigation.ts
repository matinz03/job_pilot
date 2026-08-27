export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", id: "dashboard" },
  { href: "/find-jobs", label: "Find Jobs", id: "find-jobs" },
  { href: "/profile", label: "Profile", id: "profile" },
] as const;

export type NavigationItemId = (typeof navigationItems)[number]["id"];

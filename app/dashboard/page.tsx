import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />
      <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <p className="text-sm font-medium text-accent">WELCOME TO JOBPILOT</p>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your job search workspace is being prepared.
          </p>
        </section>
      </main>
    </div>
  );
}

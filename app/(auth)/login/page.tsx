import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function LoginPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (user && !error) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6">
      <LoginForm />
    </main>
  );
}

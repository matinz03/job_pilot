import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function ProfilePage() {
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
      <Navbar activeItem="profile" isAuthenticated />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <ProfileForm email={user.email ?? ""} />
      </main>
    </div>
  );
}

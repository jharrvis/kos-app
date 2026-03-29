import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return <p>Redirecting to login...</p>;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    return <p>Error loading profile</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold text-gray-800">
          Welcome, {profile.full_name || "User"}
        </h1>
      </header>
      <div className="p-4">
        {profile.role === "tenant" ? (
          <div>
            <h2 className="text-lg font-semibold">Tenant Dashboard</h2>
            <p>Explore available kos and manage your bookings.</p>
          </div>
        ) : profile.role === "provider" ? (
          <div>
            <h2 className="text-lg font-semibold">Provider Dashboard</h2>
            <p>Manage your listings and view tenant inquiries.</p>
          </div>
        ) : (
          <p>Invalid role</p>
        )}
      </div>
    </main>
  );
}
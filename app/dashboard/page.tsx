import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import TrialBanner from "@/components/TrialBanner";

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
      <TrialBanner />
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold text-gray-800">
          Welcome, {profile.full_name || "User"}
        </h1>
      </header>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <ul className="flex space-x-6 p-4">
          <li>
            <a
              href="/dashboard/subscription"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
              Langganan
            </a>
          </li>
          {profile.role === "provider" && (
            <li>
              <a
                href="/dashboard/properties"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
                Properti Saya
              </a>
            </li>
          )}
          {profile.role === "admin" && (
            <li>
              <a
                href="/admin/subscriptions"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Admin Panel
              </a>
            </li>
          )}
        </ul>
      </nav>
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
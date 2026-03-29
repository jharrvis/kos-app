import AdminGuard from "@/components/AdminGuard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-gray-50">
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-4">
              <li>
                <a
                  href="/admin/subscriptions"
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Kelola Langganan
                </a>
              </li>
              <li>
                <a
                  href="/admin/featured"
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Properti Unggulan
                </a>
              </li>
              <li>
                <a
                  href="/admin/audit-logs"
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Log Audit
                </a>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default async function AdminGuard({ children }: AdminGuardProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/dashboard");
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
    return null;
  }

  return <>{children}</>;
}
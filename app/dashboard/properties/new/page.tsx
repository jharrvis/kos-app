import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PropertyForm from "./PropertyForm";

export default async function NewPropertyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "provider") {
    redirect("/dashboard");
  }

  return <PropertyForm />;
}
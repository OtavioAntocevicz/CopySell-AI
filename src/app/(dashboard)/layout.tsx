import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { createClient } from "@/server/supabase/server";
import { getUsageSummaryForUser } from "@/server/usage/usage-service";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  const usage = await getUsageSummaryForUser(supabase, user.id);

  return (
    <DashboardShell
      email={user.email ?? user.id}
      isAdmin={isAdmin}
      usageSummary={
        usage
          ? {
              monthlyUsed: usage.monthlyUsed,
              monthlyCap: usage.monthlyCap,
              extraCredits: usage.extraCredits,
            }
          : null
      }
      usageSummaryError={usage === null}
    >
      {children}
    </DashboardShell>
  );
}

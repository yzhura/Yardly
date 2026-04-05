"use server";

import { redirect } from "next/navigation";
import { clearActiveTenantCookie } from "@/lib/active-tenant-cookie";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActiveTenantCookie();
  redirect("/login");
}

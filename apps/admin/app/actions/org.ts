"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-url";
import { createClient } from "@/lib/supabase/server";

export async function selectOrganization(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const { memberships } = (await res.json()) as {
    memberships: { tenant: { id: string } }[];
  };

  if (!memberships.some((m) => m.tenant.id === tenantId)) {
    redirect("/select-organization?error=forbidden");
  }

  const store = await cookies();
  store.set("yardly_tenant_id", tenantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}

export async function setupOrganization(formData: FormData) {
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) {
    redirect("/setup-tenant?error=empty");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const res = await fetch(`${getApiBaseUrl()}/tenants/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    redirect("/setup-tenant?error=setup_failed");
  }

  const data = (await res.json()) as { tenant: { id: string } };

  const store = await cookies();
  store.set("yardly_tenant_id", data.tenant.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}

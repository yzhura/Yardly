"use server";

import { redirect } from "next/navigation";
import { setActiveTenantCookie } from "@/lib/active-tenant-cookie";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

export async function selectOrganization(tenantId: string) {
  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    redirect("/login");
  }

  const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/auth/backend-unavailable");
  }

  const { memberships } = (await res.json()) as {
    memberships: { tenant: { id: string } }[];
  };

  if (!memberships.some((m) => m.tenant.id === tenantId)) {
    redirect("/select-organization?error=forbidden");
  }

  await setActiveTenantCookie(tenantId);
  redirect("/");
}

export async function setupOrganization(formData: FormData) {
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) {
    redirect("/setup-tenant?error=empty");
  }

  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    redirect("/login");
  }

  const res = await fetch(`${getApiBaseUrl()}/tenants/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    redirect("/setup-tenant?error=setup_failed");
  }

  const data = (await res.json()) as { tenant: { id: string } };

  await setActiveTenantCookie(data.tenant.id);
  redirect("/");
}

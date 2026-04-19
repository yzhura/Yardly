import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { handleApiProxyError } from "@/lib/api-proxy-error";
import { isTenantCuid } from "@/lib/tenant-cuid";
import { cookies } from "next/headers";

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (await cookies()).get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const tenantHeaders: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (tenantId && isTenantCuid(tenantId)) {
    tenantHeaders["X-Tenant-Id"] = tenantId;
  }

  const res = await fetch(`${getApiBaseUrl()}/users/me/profile`, {
    headers: tenantHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося завантажити профіль");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: Request) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { message: "Некоректне тіло запиту" },
      { status: 400 },
    );
  }

  const tenantId = (await cookies()).get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const tenantHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (tenantId && isTenantCuid(tenantId)) {
    tenantHeaders["X-Tenant-Id"] = tenantId;
  }

  const res = await fetch(`${getApiBaseUrl()}/users/me/profile`, {
    method: "PATCH",
    headers: tenantHeaders,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося зберегти профіль");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

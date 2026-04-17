import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { handleApiProxyError } from "@/lib/api-proxy-error";

type RouteParams = {
  params: Promise<{ tenantId: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const { tenantId } = await params;
  const res = await fetch(`${getApiBaseUrl()}/tenants/${tenantId}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося завантажити налаштування компанії");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const { tenantId } = await params;
  const body = await req.text();
  const res = await fetch(`${getApiBaseUrl()}/tenants/${tenantId}/settings`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося зберегти налаштування компанії");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

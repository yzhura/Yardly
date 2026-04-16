import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { handleApiProxyError } from "@/lib/api-proxy-error";

type RouteParams = {
  params: Promise<{ tenantId: string; definitionId: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ message: "Потрібна авторизація" }, { status: 401 });

  const { tenantId, definitionId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Некоректне тіло запиту" }, { status: 400 });
  }

  const res = await fetch(`${getApiBaseUrl()}/tenants/${tenantId}/attributes/${definitionId}/values`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося створити значення");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}


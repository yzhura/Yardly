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
  const url = new URL(_.url);
  const q = url.searchParams.get("q") ?? undefined;
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const colorId = url.searchParams.get("colorId") ?? undefined;

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (categoryId) sp.set("categoryId", categoryId);
  if (colorId) sp.set("colorId", colorId);

  const qs = sp.toString();
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/materials${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося завантажити список матеріалів");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const { tenantId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Некоректне тіло запиту" }, { status: 400 });
  }

  const res = await fetch(`${getApiBaseUrl()}/tenants/${tenantId}/materials`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося створити матеріал");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}


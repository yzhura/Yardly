import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { handleApiProxyError } from "@/lib/api-proxy-error";

type RouteParams = {
  params: Promise<{ tenantId: string; productId: string; variantId: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Потрібна авторизація" }, { status: 401 });
  }

  const { tenantId, productId, variantId } = await params;
  const body = await req.json().catch(() => null);
  const mimeType = body?.mimeType;
  if (!mimeType || typeof mimeType !== "string") {
    return NextResponse.json({ message: "Некоректне тіло запиту" }, { status: 400 });
  }

  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/products/${productId}/variants/${variantId}/image/signed-upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mimeType }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return handleApiProxyError(res, "Не вдалося підготувати завантаження");
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

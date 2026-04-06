import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

type RouteParams = {
  params: Promise<{ tenantId: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const res = await fetch(`${getApiBaseUrl()}/tenants/${tenantId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to fetch tenant members" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

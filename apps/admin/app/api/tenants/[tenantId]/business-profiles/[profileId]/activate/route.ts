import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

type RouteParams = {
  params: Promise<{ tenantId: string; profileId: string }>;
};

export async function POST(_: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, profileId } = await params;
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/business-profiles/${profileId}/activate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to activate business profile" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

type RouteParams = {
  params: Promise<{ tenantId: string; profileId: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, profileId } = await params;
  const body = await req.text();
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/business-profiles/${profileId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );

  if (!res.ok) {
    let details: unknown = null;
    try {
      details = await res.json();
    } catch {
      details = null;
    }
    return NextResponse.json(
      { message: "Failed to update business profile", details },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

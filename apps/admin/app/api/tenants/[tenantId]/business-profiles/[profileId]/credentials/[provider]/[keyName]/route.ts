import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

type RouteParams = {
  params: Promise<{
    tenantId: string;
    profileId: string;
    provider: string;
    keyName: string;
  }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, profileId, provider, keyName } = await params;
  const body = await req.text();
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/business-profiles/${profileId}/credentials/${provider}/${keyName}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to upsert integration secret" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, profileId, provider, keyName } = await params;
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/business-profiles/${profileId}/credentials/${provider}/${keyName}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to remove integration secret" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

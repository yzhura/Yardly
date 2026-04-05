import { TeamInviteForm } from "@/components/team-invite-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TEAM_INVITE_UI } from "@/constants/team-invite";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { requireAuthMe } from "@/lib/auth-server";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function TeamInvitePage() {
  const me = await requireAuthMe();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const activeMembership = activeTenantId
    ? me.memberships.find((m) => m.tenant.id === activeTenantId)
    : undefined;

  if (!activeMembership) {
    redirect("/select-organization");
  }

  const canInvite =
    activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {TEAM_INVITE_UI.cardTitle}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {activeMembership.tenant.name} · ви —{" "}
          {organizationRoleLabel(activeMembership.role)}
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Запрошення</CardTitle>
          <CardDescription>
            Надішліть колезі доступ до цієї організації.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!canInvite ? (
            <p className="text-sm text-muted-foreground">
              {TEAM_INVITE_UI.forbiddenHint}
            </p>
          ) : (
            <TeamInviteForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

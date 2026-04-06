import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TeamInviteForm } from "@/components/team-invite-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TEAM_INVITE_UI } from "@/constants/team-invite";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function TeamInvitePage() {
  const { activeMembership } = await requireActiveMembership();

  const canInvite =
    activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        className="w-fit gap-2 px-0 text-muted-foreground"
        asChild
      >
        <Link href="/team">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          До списку команди
        </Link>
      </Button>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
    </div>
  );
}

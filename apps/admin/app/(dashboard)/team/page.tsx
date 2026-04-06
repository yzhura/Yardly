import { requireActiveMembership } from "@/lib/require-active-membership";
import { TeamMembersView } from "./team-members-view";

export default async function TeamPage() {
  const { me, activeMembership } = await requireActiveMembership();

  const canInvite =
    activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <TeamMembersView
      tenantId={activeMembership.tenant.id}
      canInvite={canInvite}
      currentUserId={me.user.id}
      actorRole={activeMembership.role}
    />
  );
}

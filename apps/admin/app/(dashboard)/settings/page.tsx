import { BusinessProfilesSettingsCard } from "@/components/settings/business-profiles-settings-card";
import { ThemeSettingsCard } from "@/components/settings/theme-settings-card";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function SettingsPage() {
  const { activeMembership } = await requireActiveMembership();
  const canManageProfiles =
    activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Налаштування
        </h1>
        <p className="mt-2 text-muted-foreground">
          Керуйте вашим виробництвом, інтеграціями та профілем бізнесу.
        </p>
      </div>

      <BusinessProfilesSettingsCard
        tenantId={activeMembership.tenant.id}
        canManage={canManageProfiles}
      />
      <ThemeSettingsCard />
    </div>
  );
}

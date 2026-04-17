import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BusinessProfilesSettingsCard } from "@/components/settings/business-profiles-settings-card";
import { CompanySettingsCard } from "@/components/settings/company-settings-card";
import { ThemeSettingsCard } from "@/components/settings/theme-settings-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Персональний профіль</CardTitle>
            <CardDescription>Імʼя, прізвище та аватар для вашого облікового запису.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
            <Link href="/settings/profile">
              Відкрити
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <BusinessProfilesSettingsCard
        tenantId={activeMembership.tenant.id}
        canManage={canManageProfiles}
      />
      <CompanySettingsCard
        tenantId={activeMembership.tenant.id}
        canManage={canManageProfiles}
      />
      <ThemeSettingsCard />
    </div>
  );
}

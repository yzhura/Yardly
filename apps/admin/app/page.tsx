import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { YardlyLogo } from "@/components/yardly-logo";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { requireAuthMe } from "@/lib/auth-server";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { Package } from "lucide-react";

export default async function HomePage() {
  const me = await requireAuthMe();

  if (me.memberships.length === 0) {
    redirect("/setup-tenant");
  }

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const activeMembership = activeTenantId
    ? me.memberships.find((m) => m.tenant.id === activeTenantId)
    : undefined;

  if (!activeMembership) {
    redirect("/select-organization");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-foreground">
            <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
            <div>
              <YardlyLogo />
              <p className="text-sm text-muted-foreground">
                {activeMembership.tenant.name} ·{" "}
                {organizationRoleLabel(activeMembership.role)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/select-organization">Змінити організацію</Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost">
                Вийти
              </Button>
            </form>
          </div>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Адмін-панель</CardTitle>
            <CardDescription>
              Облік, виробництво, доставка — далі підключайте модулі до API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Активна організація:{" "}
              <span className="font-medium text-foreground">
                {activeMembership.tenant.name}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

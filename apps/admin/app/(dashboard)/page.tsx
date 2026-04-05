import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { requireAuthMe } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";

export default async function HomePage() {
  const me = await requireAuthMe();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const activeMembership = activeTenantId
    ? me.memberships.find((m) => m.tenant.id === activeTenantId)
    : undefined;

  if (!activeMembership) {
    redirect("/select-organization");
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Дашборд
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Огляд організації та швидкі дії. Далі тут з’являться метрики, замовлення
          та виробництво.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Організація</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {activeMembership.tenant.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ваша роль:{" "}
              <span className="font-medium text-foreground">
                {organizationRoleLabel(activeMembership.role)}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Статус</CardDescription>
            <CardTitle className="text-2xl font-semibold">У розробці</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Модулі з бокового меню підключаються до API поетапно.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Підказка</CardDescription>
            <CardTitle className="text-lg font-semibold">
              Навігація зліва
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Використовуйте меню для переходу до розділів. Неактивні модулі
              показують сторінку «у розробці».
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Адмін-панель Yardly</CardTitle>
          <CardDescription>
            Облік, виробництво, доставка — підключення до Nest API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ви увійшли як{" "}
            <span className="font-medium text-foreground">
              {me.user.email ?? "користувач"}
            </span>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

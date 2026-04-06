import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function HomePage() {
  const { me, activeMembership } = await requireActiveMembership();

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
              Навігація в меню
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              На мобільному відкрийте меню у хедері, на більших екранах
              використовуйте бічну панель.
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

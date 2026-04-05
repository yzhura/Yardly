import Link from "next/link";
import { redirect } from "next/navigation";
import { selectOrganization } from "@/app/actions/org";
import { FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuthMe } from "@/lib/auth-server";
import { organizationRoleLabel } from "@/lib/organization-roles";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function SelectOrganizationPage({ searchParams }: Props) {
  const params = await searchParams;
  const me = await requireAuthMe();

  if (me.memberships.length === 0) {
    redirect("/setup-tenant");
  }

  const forbidden = params?.error === "forbidden";
  const count = me.memberships.length;

  const description =
    count > 1
      ? "Ви підключені до кількох організацій. Оберіть, з якою працювати зараз."
      : "Оберіть організацію, щоб увійти в панель, або створіть нову.";

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Оберіть організацію</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {forbidden ? (
              <FormError>Немає доступу до цієї організації.</FormError>
            ) : null}
            {me.memberships.map((m) => (
              <form
                key={m.id}
                action={selectOrganization.bind(null, m.tenant.id)}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full justify-between py-3 text-left"
                >
                  <span className="font-medium">{m.tenant.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {organizationRoleLabel(m.role)}
                  </span>
                </Button>
              </form>
            ))}
            <Button variant="ghost" asChild className="self-start">
              <Link href="/setup-tenant">Створити нову організацію</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { selectOrganization } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAuthMe } from "@/lib/auth-server";
import { organizationRoleLabel } from "@/lib/organization-roles";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function SelectOrganizationPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const me = await fetchAuthMe();
  if (!me) {
    redirect("/auth/backend-unavailable");
  }

  if (me.memberships.length === 0) {
    redirect("/setup-tenant");
  }

  const forbidden = params?.error === "forbidden";

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Оберіть організацію</CardTitle>
            <CardDescription>
              Ви берете участь у кількох організаціях. Оберіть, з якою
              працювати зараз.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {forbidden ? (
              <p className="text-sm text-destructive" role="alert">
                Немає доступу до цієї організації.
              </p>
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

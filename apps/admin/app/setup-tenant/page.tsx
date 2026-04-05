import Link from "next/link";
import { redirect } from "next/navigation";
import { setupOrganization } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAuthMe } from "@/lib/auth-server";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function SetupTenantPage({ searchParams }: Props) {
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

  const errorKey = params?.error;
  const errorMessage =
    errorKey === "empty"
      ? "Введіть назву організації."
      : errorKey === "setup_failed"
        ? "Не вдалося створити організацію. Спробуйте ще раз."
        : null;

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        {me.memberships.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            У вас уже є організації.{" "}
            <Link href="/select-organization" className="text-primary underline">
              Обрати зі списку
            </Link>
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Нова організація</CardTitle>
            <CardDescription>
              Створіть компанію — ви станете власником (OWNER).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setupOrganization} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва компанії</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={1}
                  maxLength={200}
                  placeholder="Наприклад, Yardly Studio"
                />
              </div>
              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit">Створити організацію</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

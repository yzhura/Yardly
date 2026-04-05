import Link from "next/link";
import { setupOrganization } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError } from "@/components/form-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuthMe } from "@/lib/auth-server";

type Props = { searchParams?: Promise<{ error?: string }> };

export default async function SetupTenantPage({ searchParams }: Props) {
  const params = await searchParams;
  const me = await requireAuthMe();

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
          <Alert variant="success" className="text-center">
            <AlertDescription className="flex flex-wrap items-center justify-center gap-x-1">
              <span>У вас уже є організації.</span>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link href="/select-organization">Обрати зі списку</Link>
              </Button>
            </AlertDescription>
          </Alert>
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
              {errorMessage ? <FormError>{errorMessage}</FormError> : null}
              <Button type="submit">Створити організацію</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

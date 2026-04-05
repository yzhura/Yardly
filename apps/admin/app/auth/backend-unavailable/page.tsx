import Link from "next/link";
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
import { getApiBaseUrl } from "@/lib/api-url";
import { createClient } from "@/lib/supabase/server";

export default async function BackendUnavailablePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const apiUrl = getApiBaseUrl();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Не вдається зв&apos;язатися з API</CardTitle>
          <CardDescription>
            Сесія Supabase активна, але бекенд Yardly не відповідає або відхиляє
            запит. Через це неможливо завантажити профіль і організації.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Перевірте: Nest запущено, у <code className="rounded bg-muted px-1">apps/admin/.env</code>{" "}
            вказано{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_URL</code> (зараз очікується{" "}
            <span className="font-mono text-foreground">{apiUrl}</span>
            ), у <code className="rounded bg-muted px-1">apps/api/.env</code> —{" "}
            <code className="rounded bg-muted px-1">SUPABASE_URL</code> та{" "}
            <code className="rounded bg-muted px-1">SUPABASE_ANON_KEY</code> того ж проєкту, що й у
            адмінці.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <Link href="/">Спробувати знову</Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Вийти
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineCode } from "@/components/ui/inline-code";
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
          <Alert>
            <AlertTitle>Що перевірити</AlertTitle>
            <AlertDescription className="space-y-2 text-muted-foreground">
              <p>
                Переконайтеся, що Nest запущено, у{" "}
                <InlineCode>apps/admin/.env</InlineCode> задано{" "}
                <InlineCode>NEXT_PUBLIC_API_URL</InlineCode> (зараз очікується{" "}
                <span className="font-mono text-foreground">{apiUrl}</span>
                ), а в <InlineCode>apps/api/.env</InlineCode> —{" "}
                <InlineCode>SUPABASE_URL</InlineCode> та{" "}
                <InlineCode>SUPABASE_ANON_KEY</InlineCode> того ж проєкту Supabase, що й у адмінці.
              </p>
            </AlertDescription>
          </Alert>
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

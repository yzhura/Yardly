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
import { createClient } from "@/lib/supabase/server";

export default async function BackendUnavailablePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Не вдається зв&apos;язатися з API</CardTitle>
          <CardDescription>
            Сервіс тимчасово недоступний. Через це зараз неможливо завантажити
            ваш профіль та організації.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>Що робити</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Оновіть сторінку трохи пізніше. Якщо проблема повторюється,
              зверніться до підтримки.
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

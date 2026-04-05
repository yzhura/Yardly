import Link from "next/link";
import { AuthHashRescue } from "@/components/auth-hash-rescue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <AuthHashRescue />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Помилка входу</CardTitle>
          <CardDescription className="space-y-2">
            <span className="block">
              Не вдалося підтвердити посилання. Спробуйте увійти знову.
            </span>
            <span className="block text-xs">
              Для запрошень у Redirect URLs має бути саме{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                …/auth/callback
              </code>
              ; у API —{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                ADMIN_ORIGIN
              </code>{" "}
              без шляху. Якщо в адресі після входу є{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                #access_token
              </code>
              , сторінка спробує перенаправити на callback автоматично.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">На сторінку входу</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

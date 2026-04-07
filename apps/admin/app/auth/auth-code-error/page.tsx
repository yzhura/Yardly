import Link from "next/link";
import { AuthHashRescue } from "@/components/auth/auth-hash-rescue";
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
          <CardDescription>
            Не вдалося підтвердити посилання. Спробуйте увійти ще раз.
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

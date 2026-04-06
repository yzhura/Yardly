"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError, FormSuccess } from "@/components/common/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setPending(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    setMessage("Перевірте пошту — ми надіслали посилання для входу.");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вхід</CardTitle>
        <CardDescription>
          Введіть email — надішлемо magic link через Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@company.com"
            />
          </div>
          {error ? <FormError>{error}</FormError> : null}
          {message ? (
            <FormSuccess>{message}</FormSuccess>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Надсилаємо…" : "Надіслати посилання"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

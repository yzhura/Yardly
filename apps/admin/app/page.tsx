import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <div className="flex items-center gap-3 text-foreground">
          <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Yardly</h1>
            <p className="text-sm text-muted-foreground">
              Адмін-панель — облік, виробництво, доставка
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Проєкт зібрано: Next.js 15, Tailwind, Shadcn-патерн, TanStack Query,
            zustand. Далі підключайте API та Supabase Auth за потреби.
          </p>
          <div className="mt-4">
            <Button type="button">Почати</Button>
          </div>
        </div>
      </div>
    </main>
  );
}

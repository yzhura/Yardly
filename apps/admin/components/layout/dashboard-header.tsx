import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DashboardHeaderProps = {
  tenantName: string;
  userEmail: string | null;
  canInvite: boolean;
};

export function DashboardHeader({
  tenantName,
  userEmail,
  canInvite,
}: DashboardHeaderProps) {
  const initial = (userEmail?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-6 border-b border-border bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="min-w-0 shrink-0 max-w-[240px]">
        <p className="truncate text-sm font-semibold text-foreground">
          {tenantName}
        </p>
        <Link
          href="/select-organization"
          className="text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          Змінити організацію
        </Link>
      </div>

      <div className="relative hidden min-w-0 flex-1 md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Пошук (⌘K)"
          className="h-10 w-full max-w-xl rounded-lg border-border bg-muted/40 pl-9 shadow-sm"
          readOnly
          aria-label="Пошук (скоро)"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Сповіщення"
          disabled
        >
          <Bell className="h-5 w-5" />
        </Button>
        {canInvite ? (
          <Button className="hidden shadow-sm sm:inline-flex" asChild>
            <Link href="/team/invite">Запросити в команду</Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-border p-0 font-semibold shadow-sm"
          aria-label={userEmail ? `Акаунт ${userEmail}` : "Профіль"}
        >
          {initial}
        </Button>
      </div>
    </header>
  );
}

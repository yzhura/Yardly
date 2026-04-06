"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { MobileNavDrawer } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DashboardHeaderProps = {
  tenantName: string;
  userEmail: string | null;
};

export function DashboardHeader({
  tenantName,
  userEmail,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initial = (userEmail?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 sm:gap-6 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Відкрити меню"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0 max-w-[200px] shrink sm:max-w-[240px]">
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

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/90 bg-background/80 p-0 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow sm:h-10 sm:w-10"
            aria-label={userEmail ? `Акаунт ${userEmail}` : "Профіль"}
          >
            {initial}
          </Button>
        </div>
      </header>
      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        tenantName={tenantName}
      />
    </>
  );
}

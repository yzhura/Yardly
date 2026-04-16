"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, LogOut, Menu, Search, UserRound } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { MobileNavDrawer } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { greetingEmojiFromUserId } from "@/lib/dashboard-header-greeting";
import { cn } from "@/lib/utils";

const HEADER_LOGOUT_FORM_ID = "yardly-header-logout";

type DashboardHeaderProps = {
  tenantName: string;
  userEmail: string | null;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  greetingFirstName: string | null;
  greetingEmojiSeed: string;
};

export function DashboardHeader({
  tenantName,
  userEmail,
  userDisplayName,
  userAvatarUrl,
  greetingFirstName,
  greetingEmojiSeed,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initial = (userDisplayName?.trim()?.[0] ?? userEmail?.trim()?.[0] ?? "?").toUpperCase();
  const accountLabel = userDisplayName?.trim() || userEmail?.trim() || "Профіль";
  const triggerAriaLabel = `Меню облікового запису: ${accountLabel}`;
  const greetingEmoji = greetingEmojiFromUserId(greetingEmojiSeed);

  return (
    <>
      <form id={HEADER_LOGOUT_FORM_ID} action={signOut} hidden aria-hidden="true" />
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
          <p className="truncate text-sm font-semibold text-foreground">{tenantName}</p>
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

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 max-w-[min(46vw,10rem)] flex-col items-end text-right sm:max-w-[14rem] lg:max-w-[18rem]">
            {greetingFirstName ? (
              <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                Привіт, {greetingFirstName}{" "}
                <span className="whitespace-nowrap" aria-hidden>
                  {greetingEmoji}
                </span>
              </p>
            ) : (
              <div className="flex flex-col items-end gap-0.5">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Привіт! <span aria-hidden>{greetingEmoji}</span>
                </p>
                <Link
                  href="/settings/profile"
                  className="inline-flex max-w-full items-center gap-1 rounded-md text-[11px] font-medium text-amber-800 underline-offset-2 hover:underline sm:text-xs dark:text-amber-400"
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">Додай імʼя в профілі</span>
                </Link>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 overflow-hidden rounded-full border-border/90 bg-background/80 p-0 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow sm:h-10 sm:w-10",
                  userAvatarUrl && "p-0",
                )}
                aria-label={triggerAriaLabel}
                aria-haspopup="menu"
              >
                {userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{initial}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="min-w-[11rem]">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings/profile" className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" aria-hidden />
                  Профіль
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer p-0">
                <button
                  type="submit"
                  form={HEADER_LOGOUT_FORM_ID}
                  className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Вихід
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

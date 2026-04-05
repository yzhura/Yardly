"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV_MAIN } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

function navItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Package className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-lg font-extrabold leading-tight tracking-tight text-foreground">
              Yard<span className="text-primary">ly</span>
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              ERP для швейних брендів
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {DASHBOARD_NAV_MAIN.map((item) => {
          const active = navItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Вихід</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}

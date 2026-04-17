"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "@/app/actions/auth";
import { TenantLogoBadge } from "@/components/common/tenant-logo-badge";
import { Button } from "@/components/ui/button";
import {
  APPLE_SPRING,
  listItemReveal,
  MOTION_DURATION,
  MOTION_EASE,
} from "@/lib/motion";
import { DASHBOARD_NAV_MAIN } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

function navItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navChildrenActive(
  pathname: string,
  children: Array<{ href: string }>,
) {
  return children.some((child) => navItemActive(pathname, child.href));
}

type AppSidebarProps = {
  tenantName: string;
  tenantLogoUrl: string | null;
};

export function AppSidebar({ tenantName, tenantLogoUrl }: AppSidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nextOpen: Record<string, boolean> = {};
    for (const item of DASHBOARD_NAV_MAIN) {
      if (item.children?.length) {
        nextOpen[item.href] = navChildrenActive(pathname, item.children);
      }
    }
    setOpenSections((prev) => ({ ...nextOpen, ...prev }));
  }, [pathname]);

  return (
    <motion.aside
      className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur md:flex"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        ...APPLE_SPRING,
        opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
      }}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <TenantLogoBadge logoUrl={tenantLogoUrl} size="md" variant="brand" />
          <span className="min-w-0 text-left">
            <span className="block truncate text-lg font-extrabold leading-tight tracking-tight text-foreground">
              {tenantName}
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Yardly ERP
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {DASHBOARD_NAV_MAIN.map((item) => {
          const childActive = item.children?.length
            ? navChildrenActive(pathname, item.children)
            : false;
          const active = navItemActive(pathname, item.href) || childActive;
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const sectionOpen = hasChildren
            ? Boolean(openSections[item.href])
            : false;
          return (
            <motion.div
              key={item.href}
              initial={listItemReveal.initial}
              animate={listItemReveal.animate}
              transition={{
                delay: 0.03,
                duration: MOTION_DURATION.fast,
                ease: MOTION_EASE,
              }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.995 }}
            >
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [item.href]: !Boolean(prev[item.href]),
                      }))
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                      active
                        ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.16)]"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-left">
                      {item.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        sectionOpen ? "rotate-180" : "rotate-0",
                      )}
                      aria-hidden
                    />
                  </button>
                  {sectionOpen ? (
                    <div className="mt-1 space-y-1 pl-10">
                      {item.children?.map((child) => {
                        const childIsActive = navItemActive(
                          pathname,
                          child.href,
                        );
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                              childIsActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                            )}
                          >
                            <ChildIcon
                              className="h-4 w-4 shrink-0"
                              aria-hidden
                            />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                    active
                      ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.16)]"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors duration-200",
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
              )}
            </motion.div>
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
    </motion.aside>
  );
}

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  tenantName: string;
  tenantLogoUrl: string | null;
};

export function MobileNavDrawer({
  open,
  onClose,
  tenantName,
  tenantLogoUrl,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nextOpen: Record<string, boolean> = {};
    for (const item of DASHBOARD_NAV_MAIN) {
      if (item.children?.length) {
        nextOpen[item.href] = navChildrenActive(pathname, item.children);
      }
    }
    setOpenSections((prev) => ({ ...nextOpen, ...prev }));
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрити меню"
            onClick={onClose}
          />
          <motion.aside
            className="relative flex h-full w-[86vw] max-w-[320px] flex-col border-r border-border bg-background shadow-xl"
            initial={{ x: -24, opacity: 0.98 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0.98 }}
            transition={{
              ...APPLE_SPRING,
              opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Навігація"
          >
            <div className="border-b border-border px-4 py-4">
              <Link
                href="/"
                className="flex items-center gap-3"
                onClick={onClose}
              >
                <TenantLogoBadge
                  logoUrl={tenantLogoUrl}
                  size="md"
                  variant="brand"
                />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-lg font-extrabold leading-tight tracking-tight text-foreground">
                    {tenantName}
                  </span>
                  <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Yardly ERP
                  </span>
                </span>
              </Link>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
              {DASHBOARD_NAV_MAIN.map((item) => {
                const childActive = item.children?.length
                  ? navChildrenActive(pathname, item.children)
                  : false;
                const active =
                  navItemActive(pathname, item.href) || childActive;
                const Icon = item.icon;
                const hasChildren = Boolean(item.children?.length);
                return (
                  <div key={item.href} className="space-y-1">
                    {hasChildren ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSections((prev) => ({
                              ...prev,
                              [item.href]: !Boolean(prev[item.href]),
                            }))
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                            active
                              ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.16)]"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-colors duration-200",
                              active ? "text-primary" : "text-muted-foreground",
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate text-left">
                            {item.label}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              openSections[item.href]
                                ? "rotate-180"
                                : "rotate-0",
                            )}
                            aria-hidden
                          />
                        </button>
                        {openSections[item.href] ? (
                          <div className="pl-10">
                            {item.children?.map((child) => {
                              const childIsActive = navItemActive(
                                pathname,
                                child.href,
                              );
                              const ChildIcon = child.icon;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                    childIsActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                                  )}
                                >
                                  <ChildIcon
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden
                                  />
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                          active
                            ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.16)]"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors duration-200",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <Link
                href="/select-organization"
                onClick={onClose}
                className="mb-2 block text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                Змінити організацію
              </Link>
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
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

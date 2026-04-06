import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FullScreenCardLayoutProps = {
  children: ReactNode;
  /** Tailwind max-width on the inner column (e.g. max-w-lg, max-w-md). */
  maxWidthClass: string;
  ariaLabel?: string;
};

/**
 * Shared shell for full-screen auth/org flows (select organization, setup tenant).
 */
export function FullScreenCardLayout({
  children,
  maxWidthClass,
  ariaLabel = "Завантаження",
}: FullScreenCardLayoutProps) {
  return (
    <main
      className="min-h-screen bg-background px-4 py-12"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={cn("mx-auto flex w-full flex-col gap-6", maxWidthClass)}>
        {children}
      </div>
    </main>
  );
}

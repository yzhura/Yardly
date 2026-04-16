"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { APPLE_SPRING, MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

type AttributeModalShellProps = {
  /** When true, backdrop click does not close the modal. */
  busy: boolean;
  onBackdropClose: () => void;
  ariaLabel: string;
  children: ReactNode;
};

/**
 * Shared backdrop + panel motion for attribute definition/value modals (matches colors-view pattern).
 */
export function AttributeModalShell({
  busy,
  onBackdropClose,
  ariaLabel,
  children,
}: AttributeModalShellProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[120] flex min-h-dvh items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
      onClick={() => {
        if (!busy) onBackdropClose();
      }}
      role="presentation"
    >
      <motion.div
        className="w-full max-w-xl rounded-2xl border border-border/90 bg-background p-5 shadow-2xl"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{
          ...APPLE_SPRING,
          opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

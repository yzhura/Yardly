"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { APPLE_SPRING, MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Підтвердити",
  cancelLabel = "Скасувати",
  confirmVariant = "default",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const canUsePortal = typeof window !== "undefined";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading, onClose]);

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
          onClick={() => {
            if (!loading) {
              onClose();
            }
          }}
          role="presentation"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-border/90 bg-background p-5 shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              ...APPLE_SPRING,
              opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
                {loading ? "Зачекайте..." : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (!canUsePortal) {
    return modal;
  }

  return createPortal(modal, document.body);
}

"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import { APPLE_SPRING, MOTION_DURATION, MOTION_EASE, surfaceReveal } from "@/lib/motion";

type DashboardMotionProps = {
  children: ReactNode;
};

export function DashboardMotion({ children }: DashboardMotionProps) {
  return (
    <motion.div
      initial={surfaceReveal.initial}
      animate={surfaceReveal.animate}
      transition={{
        ...APPLE_SPRING,
        opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
      }}
    >
      {children}
    </motion.div>
  );
}

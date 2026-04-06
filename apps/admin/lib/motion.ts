export const MOTION_DURATION = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.24,
  slow: 0.32,
} as const;

export const MOTION_EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

export const APPLE_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

export const surfaceReveal = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: 8, filter: "blur(4px)" },
};

export const listItemReveal = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

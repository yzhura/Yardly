"use client";

import type { Color } from "@/api/materials/types";

type MaterialTableColorCellProps = {
  color: Color | null;
};

export function MaterialTableColorCell({ color }: MaterialTableColorCellProps) {
  if (!color) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex min-w-0 max-w-[200px] items-center gap-2 sm:max-w-[220px]">
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border/60"
        style={{ backgroundColor: color.hex }}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{color.name}</p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">{color.hex}</p>
      </div>
    </div>
  );
}

import type { TransformFnParams } from "class-transformer";

/**
 * Single source of truth for material units. Must stay aligned with admin `UNIT_OPTIONS`.
 */
export const MATERIAL_ALLOWED_UNITS = ["м", "шт", "кг", "см"] as const;

export type MaterialUnitDto = (typeof MATERIAL_ALLOWED_UNITS)[number];

export function parseOptionalFloat(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  return undefined;
}

/** Normalizes legacy Latin "m" (meters) to Ukrainian "м" before @IsIn validation. */
export function transformMaterialUnit({ value }: TransformFnParams): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "m") return "м";
  return trimmed;
}

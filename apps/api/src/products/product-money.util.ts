import { Prisma } from "@prisma/client";

export function toMoneyDecimal(amount: number): Prisma.Decimal {
  if (!Number.isFinite(amount) || amount < 0) {
    return new Prisma.Decimal(0);
  }
  return new Prisma.Decimal(String(amount));
}

export function toOptionalMoneyDecimal(amount: number | null | undefined): Prisma.Decimal | null {
  if (amount === null || amount === undefined) return null;
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return new Prisma.Decimal(String(amount));
}

export function moneyDecimalToString(value: Prisma.Decimal): string {
  return value.toDecimalPlaces(2).toFixed(2);
}

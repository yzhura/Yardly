import { Building2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type TenantLogoBadgeProps = {
  logoUrl: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "header" | "brand";
  className?: string;
};

function sizeClass(size: TenantLogoBadgeProps["size"]): string {
  switch (size) {
    case "sm":
      return "h-7 w-7 rounded-md";
    case "lg":
      return "h-12 w-12 rounded-xl";
    case "md":
    default:
      return "h-10 w-10 rounded-xl";
  }
}

function fallbackIcon(size: TenantLogoBadgeProps["size"], variant: TenantLogoBadgeProps["variant"]) {
  if (variant === "brand") {
    return <Package className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", "text-primary")} aria-hidden />;
  }
  return <Building2 className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", "text-muted-foreground")} aria-hidden />;
}

export function TenantLogoBadge({
  logoUrl,
  size = "md",
  variant = "brand",
  className,
}: TenantLogoBadgeProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-primary/5 shadow-sm",
        sizeClass(size),
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        fallbackIcon(size, variant)
      )}
    </span>
  );
}

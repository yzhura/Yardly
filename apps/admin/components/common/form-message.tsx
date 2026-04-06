import type { ReactNode } from "react";
import { AlertCircle, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function FormError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) {
    return null;
  }
  return (
    <Alert
      variant="destructive"
      className={cn("flex gap-3", className)}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <AlertDescription className="pt-0.5">{children}</AlertDescription>
    </Alert>
  );
}

export function FormSuccess({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) {
    return null;
  }
  return (
    <Alert variant="success" className={cn("flex gap-3", className)}>
      <CircleCheck
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <AlertDescription className="pt-0.5">{children}</AlertDescription>
    </Alert>
  );
}

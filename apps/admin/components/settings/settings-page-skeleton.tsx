import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches settings page: page title + theme card with select-shaped control.
 */
export function SettingsPageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8"
      aria-busy="true"
      aria-label="Завантаження налаштувань"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" aria-hidden />
        <Skeleton className="h-4 w-full max-w-xl" aria-hidden />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" aria-hidden />
          <Skeleton className="h-4 w-full max-w-lg" aria-hidden />
          <Skeleton className="h-4 w-full max-w-md" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full max-w-xs rounded-md" aria-hidden />
          <Skeleton className="h-3 w-64 max-w-full" aria-hidden />
        </CardContent>
      </Card>
    </div>
  );
}

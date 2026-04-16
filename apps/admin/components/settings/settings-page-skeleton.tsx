import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches `/settings`: title, personal profile card, business profiles card, theme card.
 */
export function SettingsPageSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6 sm:gap-8"
      aria-busy="true"
      aria-label="Завантаження налаштувань"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" aria-hidden />
        <Skeleton className="h-4 w-full max-w-2xl" aria-hidden />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-52 max-w-full" aria-hidden />
            <Skeleton className="h-4 w-full max-w-lg" aria-hidden />
          </div>
          <Skeleton className="h-9 w-[120px] shrink-0 rounded-md" aria-hidden />
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-64 max-w-full" aria-hidden />
          <Skeleton className="h-4 w-full max-w-xl" aria-hidden />
          <Skeleton className="h-4 w-full max-w-lg" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/15 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-5 w-40" aria-hidden />
              <Skeleton className="h-8 w-28 rounded-full" aria-hidden />
            </div>
            <Skeleton className="h-4 w-full max-w-md" aria-hidden />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-md" aria-hidden />
              <Skeleton className="h-10 w-full rounded-md" aria-hidden />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-lg" aria-hidden />
          <Skeleton className="h-24 w-full rounded-lg" aria-hidden />
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-44" aria-hidden />
          <Skeleton className="h-4 w-full max-w-xl" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full max-w-xs rounded-md" aria-hidden />
          <Skeleton className="h-3 w-56 max-w-full" aria-hidden />
        </CardContent>
      </Card>
    </div>
  );
}

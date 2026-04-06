import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStatCardsGrid } from "@/components/skeletons/skeleton-blocks";

/**
 * Matches typical dashboard pages: page heading + stat grid + footer card.
 */
export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true" aria-label="Завантаження сторінки">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" aria-hidden />
        <Skeleton className="h-4 w-full max-w-2xl" aria-hidden />
        <Skeleton className="h-4 w-full max-w-xl" aria-hidden />
      </div>

      <SkeletonStatCardsGrid variant="dashboard" />

      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-56" aria-hidden />
          <Skeleton className="h-4 w-full max-w-md" aria-hidden />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-sm" aria-hidden />
        </CardContent>
      </Card>
    </div>
  );
}

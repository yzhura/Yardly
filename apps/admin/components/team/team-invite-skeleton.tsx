import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormFieldRowSkeleton } from "@/components/skeletons/skeleton-blocks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors team invite route: back link row, title block, invite card.
 */
export function TeamInvitePageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Завантаження">
      <Skeleton className="h-9 w-48 rounded-md" aria-hidden />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full max-w-md sm:h-9" aria-hidden />
          <Skeleton className="h-4 w-full max-w-lg" aria-hidden />
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-36" aria-hidden />
            <Skeleton className="h-4 w-full max-w-sm" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-4">
            <FormFieldRowSkeleton labelClassName="h-4 w-24" />
            <Skeleton className="h-4 w-20" aria-hidden />
            <Skeleton className="h-10 w-full max-w-[200px] rounded-md" aria-hidden />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

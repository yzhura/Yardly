import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FullScreenCardLayout } from "./full-screen-card-layout";
import { FormFieldRowSkeleton } from "@/components/skeletons/skeleton-blocks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors setup-tenant form card (title, description, label + input + submit).
 */
export function SetupTenantSkeleton() {
  return (
    <FullScreenCardLayout maxWidthClass="max-w-md">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-48" aria-hidden />
          <Skeleton className="h-4 w-full" aria-hidden />
          <Skeleton className="h-4 w-full max-w-[280px]" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-4">
          <FormFieldRowSkeleton />
          <Skeleton className="h-10 w-full max-w-[140px] rounded-md" aria-hidden />
        </CardContent>
      </Card>
    </FullScreenCardLayout>
  );
}

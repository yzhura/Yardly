import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FullScreenCardLayout } from "./full-screen-card-layout";
import { Skeleton } from "@/components/ui/skeleton";

const BUTTON_ROW_COUNT = 3;

/**
 * Mirrors select-organization list of full-width outline buttons.
 */
export function SelectOrganizationSkeleton() {
  return (
    <FullScreenCardLayout maxWidthClass="max-w-lg">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-56" aria-hidden />
          <Skeleton className="h-4 w-full" aria-hidden />
          <Skeleton className="h-4 w-full max-w-[320px]" aria-hidden />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: BUTTON_ROW_COUNT }, (_, i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-md" aria-hidden />
          ))}
          <Skeleton className="mt-1 h-9 w-48 rounded-md" aria-hidden />
        </CardContent>
      </Card>
    </FullScreenCardLayout>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MaterialsTableBodySkeleton } from "./materials-skeleton";
import { MaterialsTableHeadRow } from "./materials-table-head";

/**
 * Route-level shell for `/materials`: mirrors MaterialsView layout (header, filters, table).
 */
export function MaterialsPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-label="Завантаження матеріалів"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full sm:h-9" aria-hidden />
          <Skeleton className="h-4 w-full max-w-2xl" aria-hidden />
        </div>
        <div className="flex flex-col gap-2 sm:items-end sm:flex-row">
          <Skeleton className="h-10 w-full rounded-md sm:w-[220px]" aria-hidden />
          <Skeleton className="h-10 w-full rounded-md sm:w-[180px]" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full rounded-md sm:w-[320px]" aria-hidden />
          <Skeleton className="h-10 w-full rounded-md sm:w-[260px]" aria-hidden />
        </div>
        <Skeleton className="h-4 w-40 shrink-0 self-end sm:self-center" aria-hidden />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <MaterialsTableHeadRow />
              </thead>
              <tbody>
                <MaterialsTableBodySkeleton />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-48" aria-hidden />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
          <Skeleton className="h-4 w-24" aria-hidden />
          <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level shell for `/products`: mirrors list layout (header, toolbar, table).
 */
export function ProductsPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-label="Завантаження списку товарів"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full sm:h-9" aria-hidden />
          <Skeleton className="h-4 w-full max-w-xl" aria-hidden />
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Skeleton className="h-10 w-28 rounded-md" aria-hidden />
          <Skeleton className="h-10 w-36 rounded-md" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-md" aria-hidden />
        <Skeleton className="h-10 w-full max-w-[200px] rounded-md sm:w-[200px]" aria-hidden />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[880px] space-y-0">
              <div className="grid grid-cols-6 gap-4 border-b border-border px-4 py-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-20" aria-hidden />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={row} className="grid grid-cols-6 items-center gap-4 border-b border-border/60 px-4 py-4">
                  <Skeleton className="h-12 w-12 rounded-md" aria-hidden />
                  <div className="col-span-2 space-y-2">
                    <Skeleton className="h-4 w-48" aria-hidden />
                    <Skeleton className="h-3 w-32" aria-hidden />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" aria-hidden />
                  <Skeleton className="h-4 w-20" aria-hidden />
                  <Skeleton className="h-8 w-16 justify-self-end" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-56" aria-hidden />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
          <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
        </div>
      </div>
    </div>
  );
}

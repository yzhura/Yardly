import { Skeleton } from "@/components/ui/skeleton";

const TABLE_SKELETON_ROWS = 6;

export function MaterialsTableBodySkeleton() {
  return (
    <>
      {Array.from({ length: TABLE_SKELETON_ROWS }, (_, i) => (
        <tr key={i} className="border-b border-border/80 last:border-0">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" aria-hidden />
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-4 w-44 max-w-full" aria-hidden />
                <Skeleton className="h-3 w-32 max-w-full" aria-hidden />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-9 w-28 rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-32 rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-36 rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-24 rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-20 rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-6 w-24 rounded-full" aria-hidden />
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
              <Skeleton className="h-9 w-9 rounded-md" aria-hidden />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}


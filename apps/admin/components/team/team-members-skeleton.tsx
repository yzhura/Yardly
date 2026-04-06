import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMembersTableHeadRow } from "./team-members-table-head";
import { SkeletonStatCardsGrid } from "@/components/skeletons/skeleton-blocks";

const TABLE_SKELETON_ROWS = 6;

/**
 * Table body rows matching team members table columns (avatar + text, role, status, date, actions).
 */
export function TeamMembersTableBodySkeleton() {
  return (
    <>
      {Array.from({ length: TABLE_SKELETON_ROWS }, (_, i) => (
        <tr key={i} className="border-b border-border/80 last:border-0">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32 max-w-full" aria-hidden />
                <Skeleton className="h-3 w-48 max-w-full" aria-hidden />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-9 w-[120px] rounded-md" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-24" aria-hidden />
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-4 w-[88px]" aria-hidden />
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-end">
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" aria-hidden />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Full team page shell while the server segment resolves (matches heading, stats grid, table card).
 */
export function TeamMembersPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-label="Завантаження сторінки команди"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 sm:h-9" aria-hidden />
          <Skeleton className="h-4 w-full max-w-2xl" aria-hidden />
        </div>
        <Skeleton className="h-10 w-[min(100%,220px)] shrink-0 rounded-md" aria-hidden />
      </div>

      <SkeletonStatCardsGrid variant="team" />

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <TeamMembersTableHeadRow />
              </thead>
              <tbody>
                <TeamMembersTableBodySkeleton />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormFieldRowSkeleton } from "@/components/skeletons/skeleton-blocks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Centered card placeholder for auth flows (callback Suspense, optional login loading).
 */
export function AuthCardSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-36" aria-hidden />
          <Skeleton className="h-4 w-full max-w-[280px]" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-4">
          <FormFieldRowSkeleton labelClassName="h-4 w-14" />
          <Skeleton className="h-10 w-full rounded-md" aria-hidden />
        </CardContent>
      </Card>
    </main>
  );
}

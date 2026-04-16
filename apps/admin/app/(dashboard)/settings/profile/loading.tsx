import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileSettingsLoading() {
  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8" aria-busy="true" aria-label="Завантаження профілю">
      <div>
        <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </CardContent>
      </Card>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="flex gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-36" />
        </CardContent>
      </Card>
    </div>
  );
}

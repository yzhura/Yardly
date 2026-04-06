import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FormFieldRowSkeletonProps = {
  /** Tailwind classes for the label line (height + width). */
  labelClassName?: string;
};

/** Label + input-shaped row; used in auth card, setup tenant, invite form skeletons. */
export function FormFieldRowSkeleton({
  labelClassName = "h-4 w-40",
}: FormFieldRowSkeletonProps) {
  return (
    <div className="space-y-2">
      <Skeleton className={labelClassName} aria-hidden />
      <Skeleton className="h-10 w-full" aria-hidden />
    </div>
  );
}

const statCardVariants = {
  dashboard: {
    gridGap: "gap-6",
    label: "h-3.5 w-28",
    value: "h-8 w-40",
    footer: "h-4 w-full max-w-[200px]",
  },
  team: {
    gridGap: "gap-4",
    label: "h-3.5 w-36",
    value: "h-9 w-16",
    footer: "h-4 w-40",
  },
} as const;

type StatCardsGridVariant = keyof typeof statCardVariants;

/** Three stat-style cards: small label, large value, footer line (dashboard home vs team page). */
export function SkeletonStatCardsGrid({ variant }: { variant: StatCardsGridVariant }) {
  const v = statCardVariants[variant];
  return (
    <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3", v.gridGap)}>
      {[0, 1, 2].map((i) => (
        <Card key={i} className="border-border shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className={v.label} aria-hidden />
            <Skeleton className={v.value} aria-hidden />
          </CardHeader>
          <CardContent>
            <Skeleton className={v.footer} aria-hidden />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

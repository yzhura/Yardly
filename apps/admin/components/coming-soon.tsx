type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({
  title,
  description = "Модуль у розробці. Незабаром тут з’явиться функціонал.",
}: ComingSoonProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-10 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-3 max-w-lg text-muted-foreground">{description}</p>
    </div>
  );
}

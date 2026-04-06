type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({
  title,
  description = "Модуль у розробці. Незабаром тут з’явиться функціонал.",
}: ComingSoonProps) {
  return (
    <div className="rounded-2xl border border-border/90 bg-card/95 p-6 shadow-sm backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-10">
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      <p className="mt-3 max-w-lg text-muted-foreground">{description}</p>
    </div>
  );
}

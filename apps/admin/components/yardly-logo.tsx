import Link from "next/link";

export function YardlyLogo() {
  return (
    <h1 className="m-0 border-0 p-0">
      <Link
        href="/"
        className="inline-block rounded-sm text-left text-[26px] font-extrabold text-foreground no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Yardly — на головну"
      >
        Yard<span className="text-muted-foreground">ly</span>
      </Link>
    </h1>
  );
}

"use client";

import Link from "next/link";
import Slider from "react-slick";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatVariantPriceRange } from "@/lib/product-price";
import type { ProductListItem, ProductStatus } from "@/api/products/types";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const STATUS_UI: Record<
  ProductStatus,
  { label: string; dot: string; pill: string }
> = {
  ACTIVE: {
    label: "Активний",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/15 text-emerald-800 border-emerald-500/25",
  },
  DRAFT: {
    label: "Чернетка",
    dot: "bg-slate-400",
    pill: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  },
};

const PLACEHOLDER_SLIDE_COUNT = 3;

function PlaceholderSlide({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/60",
      )}
      aria-hidden
    >
      <Package className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type ProductGridCardProps = {
  product: ProductListItem;
};

export function ProductGridCard({ product }: ProductGridCardProps) {
  const status = STATUS_UI[product.status];
  const prices = product.variants.map((v) => v.price);
  const primarySku = product.variants[0]?.sku ?? "—";
  const tags = [...new Set(product.variants.flatMap((v) => v.attributeTags))].slice(0, 4);
  const galleryUrls =
    product.imageUrls?.length ? product.imageUrls : ([] as string[]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    adaptiveHeight: true,
    autoplay: false,
  };

  return (
    <Card className="group overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <div className="product-grid-slider px-1 pt-1">
        <Slider {...sliderSettings} aria-label={`Фото: ${product.name}`}>
          {galleryUrls.length > 0
            ? galleryUrls.map((src, i) => (
                <div key={src} className="px-1 pb-1">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <span className="sr-only">{`${product.name} — зображення ${i + 1}`}</span>
                  </div>
                </div>
              ))
            : Array.from({ length: PLACEHOLDER_SLIDE_COUNT }).map((_, i) => (
                <div key={i} className="px-1 pb-1">
                  <PlaceholderSlide label={`${product.name} — зображення ${i + 1}`} />
                </div>
              ))}
        </Slider>
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <Link
            href={`/products/${product.id}/edit`}
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground underline-offset-4 hover:underline"
          >
            {product.name}
          </Link>
          <p className="text-xs text-muted-foreground">SKU: {primarySku}</p>
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {product.catalogs?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {product.catalogs.map((c) => (
              <span
                key={c.id}
                className="rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatVariantPriceRange(prices)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              status.pill,
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)} aria-hidden />
            {status.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";
import {
  Factory,
  FolderOpen,
  LayoutDashboard,
  List,
  Package,
  Settings,
  SlidersHorizontal,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional badge (e.g. pending count) */
  badge?: number;
  children?: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
  }>;
};

export const DASHBOARD_NAV_MAIN: DashboardNavItem[] = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/orders", label: "Замовлення", icon: ShoppingCart },
  {
    href: "/products",
    label: "Товари",
    icon: Package,
    children: [
      { href: "/products", label: "Список товарів", icon: List },
      { href: "/catalogs", label: "Каталоги", icon: FolderOpen },
      { href: "/attributes", label: "Характеристики", icon: SlidersHorizontal },
    ],
  },
  { href: "/materials", label: "Склад матеріалів", icon: Warehouse },
  { href: "/production", label: "Виробництво", icon: Factory },
  { href: "/team", label: "Користувачі", icon: Users },
  { href: "/settings", label: "Налаштування", icon: Settings },
];
